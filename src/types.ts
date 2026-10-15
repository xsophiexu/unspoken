export type Card = {
  word: string;
  banned: string[];
  // Draw weight in All cards; cards drawn from chosen themes have none and are equally likely.
  weight?: number;
};

export type Difficulty = 'Normal' | 'Harder' | 'Expert 1' | 'Expert 2' | 'Master 1' | 'Master 2' | 'Master 3' | 'Grandmaster';

export type Category =
  | 'Inner World'
  | 'Literature and Language'
  | 'Pop Culture'
  | 'Science and Nature'
  | 'Society'
  | 'Everyday Life'
  | 'History and Myth'
  | 'Sports and Games'
  | 'Love and Relationships'
  | 'Technology'
  | 'Computer Science'
  | 'Business'
  | 'Arts and Entertainment'
  | 'Fantasy and Sci-Fi';

// A card as stored in the word bank. Banned words run strongest first, up to 10. Newer banks tag
// each card with one or more themes; older ones have a single theme.
export type BankCard = Card & {
  difficulty: Difficulty;
  score: number;
  themes?: Category[];
  theme?: Category;
  // False for names, specific events and myths, and insider jargon: playable in their themes, never in All cards.
  allCards?: boolean;
  // Balances themes in All cards.
  allCardsWeight?: number;
};

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
  // Word themes to draw from. Empty means all cards.
  categories: Category[];
  // Round length in seconds. Ignored by modes without a clock.
  roundSeconds: number;
  // Skips allowed per round, or null for unlimited.
  skips: number | null;
};
