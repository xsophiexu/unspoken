// Mind Reader: the Mind Readers see the word and write 5 words they think the Clue Giver will say,
// then show the Clue Giver the word. While the Clue Giver gives clues, the Mind Readers tap each
// predicted word they hear. Three ways to play:
// - quick: one tap to start, no scores, no teams; play word after word until the players stop.
// - custom: a lineup (Individual or Teams) and a number of rounds; turns rotate and score.
// - practice: one guided turn with a coach card on each step, then how scoring works.

import { gameConfig, type GameConfig } from '../config';
import { hasTimeLimit, modeRules, withDifficulty } from '../rules';
import type { Card, GameSettings } from '../types';
import { canPlay } from '../mindReader/lineup';
import {
  clampRounds,
  fixTurn,
  guessPoints,
  standings,
  totalTurns,
  turnRoles,
  type MindReaderSetup,
  type PlayedTurn,
  type SpokenEntry,
  type Standing,
  type TurnResult,
  type TurnRoles,
} from '../mindReader/match';
import { advance, currentCard, newDeck, type DeckState } from './deck';
import type { RoundOptions } from './swipe';

export const MIND_READER_PLAYS = ['quick', 'custom', 'practice'] as const;
export type MindReaderPlay = (typeof MIND_READER_PLAYS)[number];

// roles → predict → show (the Clue Giver sees the word) → clues → over → scores → roles …
// A Custom game ends on results; practice ends on scoring (how scoring works).
export type MindReaderPhase = 'roles' | 'predict' | 'show' | 'clues' | 'over' | 'scores' | 'results' | 'scoring';

export type MindReaderMatch = { setup: MindReaderSetup; turns: readonly PlayedTurn[] };

export type MindReaderRoundState = {
  kind: 'mindReader';
  settings: GameSettings;
  config: GameConfig;
  deck: DeckState;
  play: MindReaderPlay;
  phase: MindReaderPhase;
  predictions: readonly string[];
  // Predicted words said during this turn's clues.
  spoken: readonly SpokenEntry[];
  // Seconds since clues began.
  elapsed: number;
  // The turn's time limit in seconds, or null to count up with no limit.
  limit: number | null;
  paused: boolean;
  // Whether the last word was guessed (Quick Play and practice).
  guessed: boolean;
  // 1-based: the word being played this game.
  word: number;
  // Practice: the coach card for this step is showing.
  coach: boolean;
  // Custom games only.
  match: MindReaderMatch | null;
};

export type MindReaderStart = { play: MindReaderPlay; setup?: MindReaderSetup };

export type MindReaderAction =
  | { type: 'showWord' }
  | { type: 'predict'; index: number; text: string }
  | { type: 'handOff' }
  | { type: 'startClues' }
  | { type: 'spoke'; prediction: number }
  | { type: 'unspoke'; entry: number }
  | { type: 'tick'; seconds: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'finishClues'; guessed: boolean }
  | { type: 'dismissCoach' }
  | { type: 'fixTurn'; guessed: boolean; spoken: readonly SpokenEntry[]; predictions: number }
  | { type: 'next' };

function emptyPredictions(config: GameConfig): string[] {
  return Array.from({ length: config.mindReader.predictions }, () => '');
}

// Quick Play's settings from the saved ones: Mind Reader at the Quick Play difficulty.
export function quickPlaySettings(settings: GameSettings, config: GameConfig = gameConfig): GameSettings {
  return withDifficulty({ ...settings, mode: 'mindReader' }, config.mindReader.quickDifficulty, config);
}

export function createMindReaderRound(
  settings: GameSettings,
  { cards, seed, config = gameConfig, mindReader = { play: 'quick' } }: RoundOptions & { mindReader?: MindReaderStart },
): MindReaderRoundState {
  if (modeRules(settings.mode, config).play !== 'mindReader') throw new Error(`${settings.mode} is not Mind Reader`);
  // A Custom game whose lineup can't play falls back to Quick Play.
  const custom = mindReader.play === 'custom' && mindReader.setup && canPlay(mindReader.setup.lineup, config) ? mindReader.setup : null;
  const play: MindReaderPlay = mindReader.play === 'custom' && !custom ? 'quick' : mindReader.play;
  return {
    kind: 'mindReader',
    settings,
    config,
    deck: newDeck(cards, seed),
    play,
    phase: play === 'practice' ? 'predict' : 'roles',
    predictions: emptyPredictions(config),
    spoken: [],
    elapsed: 0,
    // Only Custom games run a clock; Quick Play and practice count up.
    limit: custom && hasTimeLimit(settings, config) ? settings.roundSeconds : null,
    paused: false,
    guessed: false,
    word: 1,
    coach: play === 'practice',
    match: custom ? { setup: { ...custom, rounds: clampRounds(custom.rounds, config) }, turns: [] } : null,
  };
}

// --- Selectors -------------------------------------------------------------------------------

export function mindReaderCard(state: MindReaderRoundState): Card | null {
  return currentCard(state.deck) ?? null;
}

// The predictions with text, trimmed, in the order written.
export function filledPredictions(state: MindReaderRoundState): string[] {
  return state.predictions.map((p) => p.trim()).filter(Boolean);
}

// Predictions still to write before the Clue Giver sees the word.
export function predictionsNeeded(state: MindReaderRoundState): number {
  return Math.max(0, state.config.mindReader.predictions - filledPredictions(state).length);
}

// The clock during clues: seconds left with a time limit, seconds so far without one.
export function mindReaderClock(state: MindReaderRoundState): number {
  return state.limit === null ? state.elapsed : Math.max(0, state.limit - state.elapsed);
}

// How much of the time limit is left, 1 to 0 (0 with no limit).
export function mindReaderClockProgress(state: MindReaderRoundState): number {
  return state.limit === null || state.limit <= 0 ? 0 : mindReaderClock(state) / state.limit;
}

// When a predicted word was said, on the turn's clock: time left with a limit, time so far without.
export function spokenClock(state: Pick<MindReaderRoundState, 'limit'>, entry: SpokenEntry): number {
  return state.limit === null ? entry.at : Math.max(0, state.limit - entry.at);
}

// What a correct guess would score right now.
export function guessValueNow(state: MindReaderRoundState): number {
  return guessPoints(state.limit === null ? null : mindReaderClock(state), state.config);
}

export function isMindReaderClockRunning(state: MindReaderRoundState): boolean {
  return state.phase === 'clues' && !state.paused;
}

export function totalMatchTurns(state: MindReaderRoundState): number {
  return state.match ? totalTurns(state.match.setup) : 0;
}

export function isMatchOver(state: MindReaderRoundState): boolean {
  return state.match !== null && state.match.turns.length >= totalTurns(state.match.setup);
}

// Whether this phase shows the turn just played (its result is already in match.turns).
function afterTurn(phase: MindReaderPhase): boolean {
  return phase === 'over' || phase === 'scores' || phase === 'results';
}

// The roles of the turn being played, or of the turn just played on over, scores and results.
export function currentRoles(state: MindReaderRoundState): TurnRoles | null {
  if (!state.match) return null;
  const { turns, setup } = state.match;
  if (afterTurn(state.phase)) return turns[turns.length - 1]?.roles ?? null;
  return turnRoles(setup.lineup, turns.length);
}

// The roles of the turn after the current one, or null when the current turn is the last.
export function nextRoles(state: MindReaderRoundState): TurnRoles | null {
  if (!state.match) return null;
  const { turns, setup } = state.match;
  const next = afterTurn(state.phase) ? turns.length : turns.length + 1;
  return next < totalTurns(setup) ? turnRoles(setup.lineup, next) : null;
}

export function lastTurn(state: MindReaderRoundState): PlayedTurn | null {
  const turns = state.match?.turns ?? [];
  return turns[turns.length - 1] ?? null;
}

export function matchStandings(state: MindReaderRoundState): Standing[] {
  return state.match ? standings(state.match.setup.lineup, state.match.turns, state.config) : [];
}

// --- Reducer ---------------------------------------------------------------------------------

function finish(state: MindReaderRoundState, guessed: boolean): MindReaderRoundState {
  const base = { ...state, guessed, paused: false, coach: false };
  if (state.play === 'practice') return { ...base, phase: 'scoring' };
  if (!state.match) return { ...base, phase: 'over' };
  const { setup, turns } = state.match;
  const result: TurnResult = {
    guessed,
    secondsLeft: state.limit === null ? null : mindReaderClock(state),
    spoken: state.spoken,
    extra: 0,
  };
  const played: PlayedTurn = { roles: turnRoles(setup.lineup, turns.length), word: mindReaderCard(state)?.word ?? '', result };
  return { ...base, phase: 'over', match: { ...state.match, turns: [...turns, played] } };
}

// The next word, back on the roles screen.
function nextWord(state: MindReaderRoundState): MindReaderRoundState {
  return {
    ...state,
    deck: advance(state.deck),
    predictions: emptyPredictions(state.config),
    spoken: [],
    elapsed: 0,
    guessed: false,
    word: state.word + 1,
    phase: 'roles',
  };
}

export function mindReaderReducer(state: MindReaderRoundState, action: MindReaderAction): MindReaderRoundState {
  switch (action.type) {
    case 'showWord':
      return state.phase === 'roles' ? { ...state, phase: 'predict' } : state;
    case 'predict':
      if (state.phase !== 'predict' || action.index < 0 || action.index >= state.predictions.length) return state;
      return { ...state, predictions: state.predictions.map((p, i) => (i === action.index ? action.text : p)) };
    case 'handOff':
      return state.phase === 'predict' && predictionsNeeded(state) === 0 ? { ...state, phase: 'show', coach: state.play === 'practice' } : state;
    case 'startClues':
      return state.phase === 'show' ? { ...state, phase: 'clues', elapsed: 0, spoken: [], coach: state.play === 'practice' } : state;
    case 'spoke': {
      if (state.phase !== 'clues' || action.prediction < 0 || action.prediction >= state.predictions.length) return state;
      return { ...state, spoken: [...state.spoken, { prediction: action.prediction, at: state.elapsed }] };
    }
    case 'unspoke':
      if (state.phase !== 'clues' || !state.spoken[action.entry]) return state;
      return { ...state, spoken: state.spoken.filter((_, i) => i !== action.entry) };
    case 'tick': {
      if (!isMindReaderClockRunning(state)) return state;
      const next = { ...state, elapsed: state.elapsed + action.seconds };
      return next.limit !== null && next.elapsed >= next.limit ? finish({ ...next, elapsed: next.limit }, false) : next;
    }
    case 'pause':
      return state.phase === 'clues' && !state.paused ? { ...state, paused: true } : state;
    case 'resume':
      return state.paused ? { ...state, paused: false } : state;
    case 'finishClues':
      return state.phase === 'clues' ? finish(state, action.guessed) : state;
    case 'dismissCoach':
      return state.coach ? { ...state, coach: false } : state;
    case 'fixTurn': {
      const last = lastTurn(state);
      if (state.phase !== 'over' || !state.match || !last) return state;
      const fixed = { ...last, result: fixTurn(last.result, action) };
      return { ...state, match: { ...state.match, turns: [...state.match.turns.slice(0, -1), fixed] } };
    }
    case 'next':
      if (state.phase === 'over') {
        if (!state.match) return nextWord(state);
        return { ...state, phase: isMatchOver(state) ? 'results' : 'scores' };
      }
      if (state.phase === 'scores') return nextWord(state);
      return state;
  }
}
