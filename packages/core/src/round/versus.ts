// Versus: the phone goes to the Clue Giver (pass), who plays a timed run of cards (turn): Correct
// or Skip, Classic style. Then everyone checks the cards (recap), tapping any card to change it.
// After every team (or player) has given clues once, the scores; after the last round, the results.

import { gameConfig, type GameConfig } from '../config';
import { modeRules } from '../rules';
import type { Card, GameSettings } from '../types';
import {
  canPlayVersus,
  clampVersusSetup,
  cycleCard,
  endsVersusRound,
  versusRoles,
  versusStandings,
  versusTotalTurns,
  versusTurnsPerRound,
  type PlayedCard,
  type VersusRoles,
  type VersusSetup,
  type VersusStanding,
  type VersusTurn,
} from '../versus/match';
import { advance, currentCard, newDeck, type DeckState } from './deck';
import type { RoundOptions } from './swipe';

// pass → turn → recap → (pass | scores → pass | results)
export type VersusPhase = 'pass' | 'turn' | 'recap' | 'scores' | 'results';

export type VersusRoundState = {
  kind: 'versus';
  settings: GameSettings;
  config: GameConfig;
  setup: VersusSetup;
  deck: DeckState;
  phase: VersusPhase;
  // Turns played, the latest last; the recap edits the latest.
  turns: readonly VersusTurn[];
  // The cards played so far this turn, and the skips used.
  cards: readonly PlayedCard[];
  skipped: number;
  // Seconds on the clock, or null with no time limit.
  clock: { total: number; left: number } | null;
  paused: boolean;
};

export type VersusAction =
  | { type: 'startTurn' }
  // Correct, crediting a guesser in Individual (the only guesser when there is one).
  | { type: 'correct'; guesser?: string }
  | { type: 'skip' }
  | { type: 'tick'; seconds?: number }
  | { type: 'pause' }
  | { type: 'resume' }
  // No time limit: the Clue Giver ends the turn.
  | { type: 'endTurn' }
  // The recap: change a card's outcome.
  | { type: 'cycleCard'; index: number }
  | { type: 'next' };

export function createVersusRound(settings: GameSettings, { cards, seed, config = gameConfig, setup }: RoundOptions & { setup?: VersusSetup }): VersusRoundState {
  if (modeRules(settings.mode, config).play !== 'versus') throw new Error(`${settings.mode} is not Versus`);
  if (!setup || !canPlayVersus(setup.lineup, config)) throw new Error('Versus needs a lineup that can play');
  const fixed = clampVersusSetup(setup, config);
  return {
    kind: 'versus',
    settings,
    config,
    setup: fixed,
    deck: newDeck(cards, seed),
    phase: 'pass',
    turns: [],
    cards: [],
    skipped: 0,
    clock: null,
    paused: false,
  };
}

// --- Selectors -------------------------------------------------------------------------------

export function versusCard(state: VersusRoundState): Card | null {
  return currentCard(state.deck) ?? null;
}

// The turn being played, or on recap, scores and results the turn just played.
export function versusCurrentRoles(state: VersusRoundState): VersusRoles {
  const after = state.phase === 'recap' || state.phase === 'scores' || state.phase === 'results';
  const latest = state.turns[state.turns.length - 1];
  return after && latest ? latest.roles : versusRoles(state.setup.lineup, state.turns.length);
}

// The roles of the next turn to play, or null when the game is over (or ends after this turn).
export function versusNextRoles(state: VersusRoundState): VersusRoles | null {
  const after = state.phase === 'recap' || state.phase === 'scores' || state.phase === 'results';
  const next = after ? state.turns.length : state.turns.length + 1;
  return next < versusTotalTurns(state.setup) ? versusRoles(state.setup.lineup, next) : null;
}

// The next time this turn's team (or player) gives clues, if the game lasts that long.
export function versusNextTimeRoles(state: VersusRoundState): VersusRoles | null {
  const roles = versusCurrentRoles(state);
  const later = roles.turn + versusTurnsPerRound(state.setup.lineup);
  return later < versusTotalTurns(state.setup) ? versusRoles(state.setup.lineup, later) : null;
}

export function versusLastTurn(state: VersusRoundState): VersusTurn | null {
  return state.turns[state.turns.length - 1] ?? null;
}

export function isVersusOver(state: VersusRoundState): boolean {
  return state.turns.length >= versusTotalTurns(state.setup);
}

export function versusSkipsLeft(state: VersusRoundState): number {
  return Math.max(0, state.setup.skips - state.skipped);
}

export function isVersusClockRunning(state: VersusRoundState): boolean {
  return state.phase === 'turn' && state.clock !== null && !state.paused;
}

export function versusClockProgress(state: VersusRoundState): number {
  if (!state.clock || state.clock.total <= 0) return 0;
  return Math.max(0, Math.min(1, state.clock.left / state.clock.total));
}

// Individual with 3 or more players: Correct names who got it.
export function needsGuesser(state: VersusRoundState): boolean {
  return state.setup.lineup.style === 'individual' && versusCurrentRoles(state).guessers.length > 1;
}

export function canVersusAnswer(state: VersusRoundState, answer: 'correct' | 'skip'): boolean {
  if (state.phase !== 'turn' || state.paused || (state.clock !== null && state.clock.left <= 0) || !versusCard(state)) return false;
  return answer === 'correct' || versusSkipsLeft(state) > 0;
}

export function versusStandingsNow(state: VersusRoundState): VersusStanding[] {
  return versusStandings(state.setup, state.turns, state.config);
}

// --- Reducer ---------------------------------------------------------------------------------

function played(state: VersusRoundState, card: Omit<PlayedCard, 'word'>): PlayedCard[] {
  return [...state.cards, { word: versusCard(state)?.word ?? '', ...card }];
}

// The turn ends: the card on screen counts as Not guessed, and the recap opens.
function endTurn(state: VersusRoundState, ended: PlayedCard['ended']): VersusRoundState {
  const cards = versusCard(state) ? played(state, { outcome: 'notGuessed', guesser: null, ended }) : [...state.cards];
  const turn: VersusTurn = { roles: versusRoles(state.setup.lineup, state.turns.length), cards };
  return { ...state, phase: 'recap', turns: [...state.turns, turn], cards: [], skipped: 0, paused: false, deck: advance(state.deck) };
}

function startTurn(state: VersusRoundState): VersusRoundState {
  const { turnSeconds, noTimeLimit } = state.setup;
  return { ...state, phase: 'turn', cards: [], skipped: 0, paused: false, clock: noTimeLimit ? null : { total: turnSeconds, left: turnSeconds } };
}

export function versusReducer(state: VersusRoundState, action: VersusAction): VersusRoundState {
  switch (action.type) {
    case 'startTurn':
      return state.phase === 'pass' ? startTurn(state) : state;
    case 'correct': {
      if (!canVersusAnswer(state, 'correct')) return state;
      const roles = versusCurrentRoles(state);
      const guessers = state.setup.lineup.style === 'individual' ? roles.guessers : [];
      const guesser = guessers.length === 1 ? guessers[0]! : action.guesser && guessers.includes(action.guesser) ? action.guesser : null;
      if (needsGuesser(state) && !guesser) return state;
      return { ...state, cards: played(state, { outcome: 'correct', guesser, ended: null }), deck: advance(state.deck) };
    }
    case 'skip':
      if (!canVersusAnswer(state, 'skip')) return state;
      return { ...state, cards: played(state, { outcome: 'notGuessed', guesser: null, ended: 'skipped' }), skipped: state.skipped + 1, deck: advance(state.deck) };
    case 'tick': {
      if (!isVersusClockRunning(state) || !state.clock) return state;
      const left = Math.max(0, state.clock.left - Math.max(0, action.seconds ?? 1));
      const next = { ...state, clock: { ...state.clock, left } };
      return left <= 0 ? endTurn(next, 'timeUp') : next;
    }
    case 'pause':
      return state.phase === 'turn' && !state.paused ? { ...state, paused: true } : state;
    case 'resume':
      return state.paused ? { ...state, paused: false } : state;
    case 'endTurn':
      return state.phase === 'turn' ? endTurn(state, null) : state;
    case 'cycleCard': {
      const last = versusLastTurn(state);
      if (state.phase !== 'recap' || !last) return state;
      return { ...state, turns: [...state.turns.slice(0, -1), cycleCard(last, action.index)] };
    }
    case 'next': {
      if (state.phase === 'recap') {
        if (isVersusOver(state)) return { ...state, phase: 'results' };
        return { ...state, phase: endsVersusRound(state.setup.lineup, state.turns.length - 1) ? 'scores' : 'pass' };
      }
      if (state.phase === 'scores') return { ...state, phase: 'pass' };
      return state;
    }
  }
}
