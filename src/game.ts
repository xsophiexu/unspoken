import bank from './data/word-banks.json';
import type { BankCard, Card, Category, Difficulty, GameSettings, ModeId } from './types';

// The word bank is written in the "Harder difficulty word samples" thread and copied from
// /mnt/project-files/unspoken/word-banks.json.
type Entry = Card & { difficulty: Difficulty; themes: Category[] };

export const BANK: Entry[] = (bank as BankCard[]).map((c) => ({
  word: c.word,
  banned: c.banned,
  difficulty: c.difficulty,
  themes: c.themes ?? (c.theme ? [c.theme] : []),
}));

// Easiest to hardest.
export const DIFFICULTIES: { id: Difficulty; badge: string }[] = [
  { id: 'Normal', badge: 'NORMAL' },
  { id: 'Harder', badge: 'HARDER' },
  { id: 'Expert 1', badge: 'EXPERT 1' },
  { id: 'Expert 2', badge: 'EXPERT 2' },
  { id: 'Master 1', badge: 'MASTER 1' },
  { id: 'Master 2', badge: 'MASTER 2' },
];

const ALL_CATEGORIES: Category[] = [
  'Inner World',
  'Literature and Language',
  'Pop Culture',
  'Arts and Entertainment',
  'Science and Nature',
  'Technology',
  'Society',
  'Business',
  'Love and Relationships',
  'Everyday Life',
  'Sports and Games',
  'History and Myth',
  'Fantasy and Sci-Fi',
];

// Only themes that have cards in the current bank.
export const CATEGORIES = ALL_CATEGORIES.filter((c) => BANK.some((card) => card.themes.includes(c)));

export function cardsFor(difficulty: Difficulty, categories: Category[]): Card[] {
  return BANK.filter(
    (c) => c.difficulty === difficulty && (categories.length === 0 || c.themes.some((t) => categories.includes(t))),
  ).map(({ word, banned }) => ({ word, banned }));
}

export function themeLabel(categories: Category[]): string {
  if (categories.length === 0) return 'All cards';
  if (categories.length === 1) return categories[0];
  return `${categories.length} themes`;
}

// Banned words shown on each card: 5 at the two easiest levels, 6 everywhere else.
export function bannedCountFor(difficulty: Difficulty): number {
  return difficulty === 'Normal' || difficulty === 'Harder' ? 5 : 6;
}

// Escalate starts with 4 banned words and adds one per correct answer. Three correct at 10 wins.
export const ESCALATE = { start: 4, max: 10, winAtMax: 3 };

export type Mode = {
  id: ModeId;
  name: string;
  sub: string;
  timed: boolean;
  scored: boolean;
  // Whether setup offers a skip limit.
  skips: boolean;
  // Seconds added to the clock for each correct answer.
  bonusSeconds?: number;
  available: boolean;
};

// Order matches the Modes grid in the design canvas.
export const MODES: Mode[] = [
  { id: 'classic', name: 'Classic', sub: 'Timed round, score what you can', timed: true, scored: true, skips: true, available: true },
  { id: 'endless', name: 'Endless', sub: 'No clock, no limits, go until you stop', timed: false, scored: true, skips: false, available: true },
  { id: 'teams', name: 'Teams', sub: 'Two teams, pass the phone', timed: true, scored: true, skips: true, available: false },
  { id: 'timeAttack', name: 'Time attack', sub: 'Correct answers add time', timed: true, scored: true, skips: true, bonusSeconds: 5, available: true },
  { id: 'escalate', name: 'Escalate', sub: 'One more banned word per correct', timed: true, scored: true, skips: true, available: true },
  { id: 'hotPotato', name: 'Hot potato', sub: 'Hidden timer, pass it on', timed: true, scored: false, skips: false, available: true },
  { id: 'zen', name: 'Zen', sub: 'No score, no clock', timed: false, scored: false, skips: false, available: true },
  { id: 'reverse', name: 'Reverse', sub: 'Guess the word from its clues', timed: false, scored: true, skips: false, available: true },
];

// Default round length grows with difficulty: 1:30 for Normal up to 4:00 for Master 2, 2:30 for Expert 1.
export function defaultSecondsFor(difficulty: Difficulty): number {
  const i = Math.max(0, DIFFICULTIES.findIndex((d) => d.id === difficulty));
  return 90 + i * 30;
}

// Hot potato picks a hidden round length at random. The shortest possible round grows with difficulty,
// from 45 s at Normal to 2:00 at Master 2, and the longest is double that.
export function hiddenSecondsFor(difficulty: Difficulty): number {
  const i = Math.max(0, DIFFICULTIES.findIndex((d) => d.id === difficulty));
  const min = 45 + i * 15;
  return Math.round(min + Math.random() * min);
}

export const SKIP_OPTIONS: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null];

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'endless',
  difficulty: 'Expert 1',
  categories: [],
  roundSeconds: 150,
  skips: 3,
};

export function modeOf(id: ModeId): Mode {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

export function difficultyOf(id: Difficulty) {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[2];
}

export function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
