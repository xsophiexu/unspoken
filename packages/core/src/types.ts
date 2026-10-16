// Identifiers are const tuples so schemas (zod, JSON) and TypeScript unions share one source.

// Easiest to hardest.
export const DIFFICULTY_IDS = [
  'Normal',
  'Harder',
  'Expert 1',
  'Expert 2',
  'Master 1',
  'Master 2',
  'Master 3',
  'Grandmaster',
] as const;
export type Difficulty = (typeof DIFFICULTY_IDS)[number];

// Word themes in the order the setup screen lists them. ("Theme" in the UI; "category" in code so it
// never collides with the visual theme in @unspoken/design-tokens.)
export const CATEGORY_IDS = [
  'Inner World',
  'Literature and Language',
  'Pop Culture',
  'Arts and Entertainment',
  'Science and Nature',
  'Health and Body',
  'Technology',
  'Computer Science',
  'Society',
  'Law and Diplomacy',
  'Business',
  'Love and Relationships',
  'Everyday Life',
  'Culture and Travel',
  'Sports and Games',
  'History and Myth',
  'Fantasy and Sci-Fi',
] as const;
export type Category = (typeof CATEGORY_IDS)[number];

// Order matches the Modes grid in the designs. Zen was removed.
export const MODE_IDS = ['classic', 'endless', 'teams', 'timeAttack', 'escalate', 'hotPotato', 'reverse', 'mindReader'] as const;
export type ModeId = (typeof MODE_IDS)[number];

// A playable card. Banned words run strongest first.
export type Card = {
  // Stable id derived from the word (words are unique across the bank).
  id: string;
  word: string;
  banned: readonly string[];
  // Draw weight in All cards; cards drawn from chosen themes have none and are equally likely.
  weight?: number;
};

// A card as stored in the word bank file. Newer banks tag each card with one or more themes; older
// ones have a single theme.
export type BankCardInput = {
  word: string;
  banned: readonly string[];
  difficulty: Difficulty;
  score?: number;
  themes?: readonly Category[];
  theme?: Category;
  // False for names, specific events and myths, and insider jargon: playable in their themes, never in All cards.
  allCards?: boolean;
  // Balances themes in All cards.
  allCardsWeight?: number;
};

// A bank card after normalization (see normalizeBank).
export type BankEntry = {
  id: string;
  word: string;
  banned: readonly string[];
  difficulty: Difficulty;
  categories: readonly Category[];
  inAll: boolean;
  allWeight: number;
};

export type GameSettings = {
  mode: ModeId;
  difficulty: Difficulty;
  // Word themes to draw from. Empty means All cards.
  categories: readonly Category[];
  // Round length in seconds. Ignored by modes without a visible clock.
  roundSeconds: number;
  // Skips allowed per round, or null for unlimited. Ignored by modes without a skip limit.
  skips: number | null;
};

// Returns a float in [0, 1). Inject one so dealing and hidden timers are reproducible in tests.
export type Random = () => number;
