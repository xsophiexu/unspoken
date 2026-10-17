import { en } from '@unspoken/content';
import {
  DIFFICULTY_IDS,
  canAnswer,
  difficultyLabel,
  clockLabel,
  clockProgress,
  isClockRunning,
  roundStats,
  roundSubline,
  swipeCard,
  type Difficulty,
  type RoundState,
  type RoundStats,
  type SwipeRoundState,
} from '@unspoken/core';

// What the play screen shows, read from the round through core's selectors and the copy catalog.
// Slot components take this and their slot config; they never look at the round or the rules.

export type HeaderModel = {
  modeName: string;
  difficulty: { name: string; badge: string };
  subline: string;
  stats: RoundStats;
};

export type ClockModel = { label: string; progress: number; running: boolean };

export type CardModel = { key: string; word: string; banned: readonly string[]; freshIndex: number | null };

export type PlayModel = HeaderModel & {
  clock: ClockModel | null;
  card: CardModel | null;
  canCorrect: boolean;
  canSkip: boolean;
  // No answer yet this round (the "swipe the card" hint shows until the first one).
  firstCard: boolean;
  // A line under the controls (Hot Potato's rule), or null.
  note: string | null;
};

const difficultyText = (pick: 'name' | 'badge') =>
  Object.fromEntries(DIFFICULTY_IDS.map((id) => [id, en.difficulties[id][pick]])) as Record<Difficulty, string>;
const names = difficultyText('name');
const badges = difficultyText('badge');

export function headerModel(state: RoundState): HeaderModel {
  const { mode, difficulties } = state.settings;
  return {
    modeName: en.modes[mode].name,
    // One difficulty by name; several as the easiest one and "+" (Hard+, HARD+).
    difficulty: {
      name: difficultyLabel(difficulties, { names, mixed: en.difficultyMix }),
      badge: difficultyLabel(difficulties, { names: badges, mixed: en.difficultyMix }),
    },
    subline: roundSubline(state, en),
    stats: roundStats(state, en),
  };
}

export function swipeModel(state: SwipeRoundState): PlayModel {
  const label = clockLabel(state, en);
  const view = swipeCard(state);
  return {
    ...headerModel(state),
    clock: label === null ? null : { label, progress: clockProgress(state), running: isClockRunning(state) },
    card: view && {
      // The deal position, so the same word dealt again still animates in as a new card.
      key: `${state.deck.seed}:${state.deck.index}`,
      word: view.card.word,
      banned: view.banned,
      freshIndex: view.freshIndex,
    },
    canCorrect: canAnswer(state, 'correct'),
    canSkip: canAnswer(state, 'skip'),
    firstCard: state.correct + state.skipped === 0,
    note: state.rules.passAfterCorrect ? en.play.hotPotatoNote : null,
  };
}
