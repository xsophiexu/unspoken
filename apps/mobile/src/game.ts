import {
  DIFFICULTY_IDS,
  MODE_IDS,
  categoriesInBank,
  categoriesLabel,
  cardsFor as cardsInBank,
  dealDeck as deal,
  defaultRoundSeconds,
  defaultSettings,
  gameConfig,
  hiddenRoundSeconds,
  modeRules,
} from '@unspoken/core';
import { bank, en } from '@unspoken/content';
import type { Card, Category, Difficulty, ModeId } from './types';

// The screens' view of @unspoken/core and @unspoken/content: rules come from the core config, names
// from the English copy catalog, cards from the content bank. Kept until the UI rebuild reads the
// packages directly.

export { bannedCountFor, formatClock } from '@unspoken/core';

// Easiest to hardest.
export const DIFFICULTIES = DIFFICULTY_IDS.map((id) => ({ id, badge: en.difficulties[id].badge }));

// Only themes that have cards in the current bank.
export const CATEGORIES = categoriesInBank(bank);

export function cardsFor(difficulty: Difficulty, categories: readonly Category[]): Card[] {
  return cardsInBank(bank, difficulty, categories);
}

export function themeLabel(categories: readonly Category[]): string {
  return categoriesLabel(categories, en);
}

export const ESCALATE = gameConfig.escalate;

export type Mode = {
  id: ModeId;
  name: string;
  sub: string;
  timed: boolean;
  scored: boolean;
  // Whether setup offers a skip limit.
  skips: boolean;
  // Seconds added to the clock for each correct answer.
  bonusSeconds: number;
  available: boolean;
};

// Order matches the Modes grid in the design canvas.
export const MODES: Mode[] = MODE_IDS.map((id) => {
  const rules = modeRules(id);
  return {
    id,
    ...en.modes[id],
    timed: rules.clock !== 'none',
    scored: rules.scored,
    skips: rules.skipLimit,
    bonusSeconds: rules.bonusSeconds,
    available: rules.available,
  };
});

export const defaultSecondsFor = (difficulty: Difficulty) => defaultRoundSeconds(difficulty);

// Hot potato's hidden round length, at random between the level's shortest round and double that.
export const hiddenSecondsFor = (difficulty: Difficulty) => hiddenRoundSeconds(difficulty, Math.random);

export const SKIP_OPTIONS = gameConfig.skipOptions;

export const DEFAULT_SETTINGS = defaultSettings();

export function modeOf(id: ModeId): Mode {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

export function difficultyOf(id: Difficulty) {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[2];
}

export const dealDeck = (cards: readonly Card[]) => deal(cards, Math.random);
