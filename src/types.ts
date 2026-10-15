export type Card = {
  word: string;
  banned: string[];
};

export type Difficulty = 'Normal' | 'Harder' | 'Expert 1' | 'Expert 2' | 'Master 1' | 'Master 2';

export type Category =
  | 'Inner World'
  | 'Literature and Language'
  | 'Pop Culture'
  | 'Science and Nature'
  | 'Society'
  | 'Everyday Life'
  | 'History and Myth';

// A card as stored in the word bank.
export type BankCard = Card & { difficulty: Difficulty; theme: Category };

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
  // Word theme to draw from, or null for all cards.
  category: Category | null;
  // Round length in seconds. Ignored by modes without a clock.
  roundSeconds: number;
  // Skips allowed per round, or null for unlimited.
  skips: number | null;
};
