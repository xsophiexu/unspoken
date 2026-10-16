import { bank, en, roundCopy } from '@unspoken/content';
import {
  canAnswer,
  cardsFor,
  clockLabel,
  clockProgress,
  createSwipeRound,
  defaultSettings,
  roundReducer,
  roundStats,
  roundSubline,
  swipeCard,
  type GameSettings,
  type RoundAction,
  type RoundState,
  type RoundStats,
  type SwipeCardView,
  type SwipeRoundState,
} from '@unspoken/core';

// What the play screen shows, in display text, built from round state through core selectors and
// the copy catalog. The slot components render only this, so the live game and the Customize
// thumbnails draw from the same model.

export type HeaderModel = {
  mode: string;
  level: string;
  badge: string;
  // The status line under the mode name (Card).
  subline: string;
  // The same status split for styles that show the score apart.
  stats: RoundStats;
};

export type PlayModel = HeaderModel & {
  // Null for modes without a clock. Hot potato's hidden clock has a label and no progress.
  clock: { label: string; progress: number } | null;
  card: SwipeCardView | null;
  canCorrect: boolean;
  canSkip: boolean;
  // A line under the controls (Hot potato).
  note: string | null;
};

export function headerModel(state: RoundState): HeaderModel {
  const level = en.difficulties[state.settings.difficulty];
  return {
    mode: en.modes[state.settings.mode].name,
    level: level.name,
    badge: level.badge,
    subline: roundSubline(state, roundCopy),
    stats: roundStats(state, roundCopy),
  };
}

export function playModel(state: SwipeRoundState): PlayModel {
  const label = clockLabel(state, roundCopy);
  return {
    ...headerModel(state),
    clock: label === null ? null : { label, progress: clockProgress(state) },
    card: swipeCard(state),
    canCorrect: canAnswer(state, 'correct'),
    canSkip: canAnswer(state, 'skip'),
    note: state.rules.passAfterEveryWord ? en.play.hotPotatoNote : null,
  };
}

// The sample round on Customize thumbnails, as the designs show it: Classic at Expert 1, 7 points,
// one skip left and 1:42 on the clock, with the word Hangover. It is a real round played through
// the reducer, so thumbnails can never drift from the game.
const SAMPLE = { cardId: 'hangover', correct: 7, skipped: 2, elapsedSeconds: 48 } as const;

export function previewModel(): PlayModel {
  const settings: GameSettings = { ...defaultSettings(), mode: 'classic', skips: SAMPLE.skipped + 1 };
  const card = bank.find((c) => c.id === SAMPLE.cardId) ?? bank[0];
  const cards = card ? [{ id: card.id, word: card.word, banned: card.banned }] : cardsFor(bank, settings.difficulty, []);
  const actions: RoundAction[] = [
    ...Array.from({ length: SAMPLE.correct }, () => ({ type: 'correct' }) as const),
    ...Array.from({ length: SAMPLE.skipped }, () => ({ type: 'skip' }) as const),
    { type: 'tick', seconds: SAMPLE.elapsedSeconds },
  ];
  const state = actions.reduce(roundReducer, createSwipeRound(settings, { cards, seed: 1 }));
  return playModel(state as SwipeRoundState);
}
