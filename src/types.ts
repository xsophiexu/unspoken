export type Card = {
  word: string;
  banned: string[];
};

export type Difficulty = 'easy' | 'hard' | 'evenHarder';

export type ModeId =
  | 'classic'
  | 'endless'
  | 'teams'
  | 'timeAttack'
  | 'escalate'
  | 'hotPotato'
  | 'zen'
  | 'reverse';

export type GameSettings = {
  mode: ModeId;
  difficulty: Difficulty;
  // Round length in seconds. Ignored by modes without a clock.
  roundSeconds: number;
  // Skips allowed per round, or null for unlimited.
  skips: number | null;
};
