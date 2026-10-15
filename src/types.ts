export type Card = {
  word: string;
  banned: string[];
};

export type Difficulty = 'normal' | 'evenHarder';

export type RoundSettings = {
  difficulty: Difficulty;
  // Seconds per round, or null for no timer.
  timer: number | null;
};

export type RoundResult = {
  correct: Card[];
  skipped: Card[];
};
