// Classic, Endless, Time attack, Escalate and Hot potato: one card at a time, swipe right for
// Correct and left for Skip. Pure reducer and selectors; the UI animates, then dispatches.

import { playableCards } from '../bank';
import { gameConfig, type GameConfig, type ModeRules } from '../config';
import { seededRandom } from '../random';
import { bannedCountFor, escalateProgress, hiddenRoundSeconds, modeRules } from '../rules';
import type { Card, GameSettings } from '../types';
import { advance, currentCard, newDeck, type DeckState } from './deck';

// Why the round is paused: the pause button (shows the Paused overlay), the ··· menu, or a sheet
// such as the difficulty picker. Any of them stops the clock and ignores answers.
export type PauseReason = 'user' | 'menu' | 'sheet';

export type SwipeRoundState = {
  kind: 'swipe';
  settings: GameSettings;
  rules: ModeRules;
  config: GameConfig;
  deck: DeckState;
  correct: number;
  skipped: number;
  // Seconds on the clock; null for modes without one. `total` grows when Time attack adds time
  // beyond the starting length, so the ring never overflows.
  clock: { total: number; left: number } | null;
  pause: PauseReason | null;
  // Hot potato: showing "Pass the phone" until the next player is ready.
  passing: boolean;
};

export type SwipeAction =
  | { type: 'correct' }
  | { type: 'skip' }
  // Time passed in whole seconds (default 1). The platform owns the timer and dispatches ticks.
  | { type: 'tick'; seconds?: number }
  | { type: 'pause'; reason?: PauseReason }
  | { type: 'resume' }
  // Hot potato: the next player has the phone.
  | { type: 'ready' };

export type RoundOptions = {
  // Cards for the chosen difficulty and themes (see cardsFor). The round never loads the bank itself.
  cards: readonly Card[];
  // Seeds dealing and Hot potato's hidden length. Use newSeed() in apps, fixed numbers in tests.
  seed: number;
  config?: GameConfig;
};

export function createSwipeRound(settings: GameSettings, { cards, seed, config = gameConfig }: RoundOptions): SwipeRoundState {
  const rules = modeRules(settings.mode, config);
  if (rules.play !== 'swipe') throw new Error(`${settings.mode} is not a swipe mode`);
  const rng = seededRandom(seed);
  const seconds =
    rules.clock === 'hidden'
      ? hiddenRoundSeconds(settings.difficulty, rng.random, config)
      : rules.clock === 'visible'
        ? settings.roundSeconds
        : null;
  return {
    kind: 'swipe',
    settings,
    rules,
    config,
    deck: newDeck(playableCards(settings.mode, cards, config), rng.seed()),
    correct: 0,
    skipped: 0,
    clock: seconds === null ? null : { total: seconds, left: seconds },
    pause: null,
    passing: false,
  };
}

// --- Selectors -------------------------------------------------------------------------------

export function swipeEscalate(state: SwipeRoundState) {
  return escalateProgress(state.correct, state.config);
}

export function isSwipeWon(state: SwipeRoundState): boolean {
  return state.rules.escalates && swipeEscalate(state).won;
}

export function isSwipeOver(state: SwipeRoundState): boolean {
  return (state.clock !== null && state.clock.left <= 0) || isSwipeWon(state);
}

// Paused, a sheet open, or waiting for the next player.
export function isSwipeHalted(state: SwipeRoundState): boolean {
  return state.pause !== null || state.passing;
}

// Whether the platform should be ticking the clock right now.
export function isClockRunning(state: SwipeRoundState): boolean {
  return state.clock !== null && !isSwipeHalted(state) && !isSwipeOver(state);
}

// Skips left this round, or null when skips are unlimited (no skip limit, or ∞ chosen).
export function skipsLeft(state: SwipeRoundState): number | null {
  if (!state.rules.skipLimit || state.settings.skips === null) return null;
  return Math.max(0, state.settings.skips - state.skipped);
}

// Whether the card takes an answer right now (Correct, or Skip when one is left).
export function canAnswer(state: SwipeRoundState, answer: 'correct' | 'skip'): boolean {
  if (isSwipeOver(state) || isSwipeHalted(state) || !currentCard(state.deck)) return false;
  return answer === 'correct' || skipsLeft(state) !== 0;
}

// Banned words showing on the card: the level's count, or Escalate's climbing count.
export function bannedShown(state: SwipeRoundState): number {
  return state.rules.escalates ? swipeEscalate(state).level : bannedCountFor(state.settings.difficulty, state.config);
}

export type SwipeCardView = {
  card: Card;
  banned: readonly string[];
  // Escalate marks the word added by the last correct answer as NEW, until the top level is reached.
  freshIndex: number | null;
};

export function swipeCard(state: SwipeRoundState): SwipeCardView | null {
  const card = currentCard(state.deck);
  if (!card) return null;
  const shown = bannedShown(state);
  const { start, max } = state.config.escalate;
  const fresh = state.rules.escalates && state.correct > 0 && state.correct <= max - start;
  return { card, banned: card.banned.slice(0, shown), freshIndex: fresh ? shown - 1 : null };
}

// Share of the round left, 0 to 1, for the timer ring or bar. Hidden clocks always read 0.
export function clockProgress(state: SwipeRoundState): number {
  if (!state.clock || state.rules.clock === 'hidden' || state.clock.total <= 0) return 0;
  return Math.max(0, Math.min(1, state.clock.left / state.clock.total));
}

// --- Reducer ---------------------------------------------------------------------------------

function answer(state: SwipeRoundState, kind: 'correct' | 'skip'): SwipeRoundState {
  if (!canAnswer(state, kind)) return state;
  const bonus = kind === 'correct' ? state.rules.bonusSeconds : 0;
  const clock =
    state.clock && bonus > 0
      ? { left: state.clock.left + bonus, total: Math.max(state.clock.total, state.clock.left + bonus) }
      : state.clock;
  return {
    ...state,
    correct: state.correct + (kind === 'correct' ? 1 : 0),
    skipped: state.skipped + (kind === 'skip' ? 1 : 0),
    clock,
    passing: state.rules.passAfterEveryWord,
    deck: advance(state.deck),
  };
}

export function swipeReducer(state: SwipeRoundState, action: SwipeAction): SwipeRoundState {
  switch (action.type) {
    case 'correct':
    case 'skip':
      return answer(state, action.type);
    case 'tick': {
      if (!isClockRunning(state) || !state.clock) return state;
      const seconds = Math.max(0, action.seconds ?? 1);
      return { ...state, clock: { ...state.clock, left: Math.max(0, state.clock.left - seconds) } };
    }
    case 'pause':
      return isSwipeOver(state) ? state : { ...state, pause: action.reason ?? 'user' };
    case 'resume':
      return state.pause === null ? state : { ...state, pause: null };
    case 'ready':
      return state.passing ? { ...state, passing: false } : state;
  }
}
