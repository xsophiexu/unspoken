import { gameConfig, type GameConfig } from './config';
import { modeRules } from './rules';
import type { BankCardInput, BankEntry, Card, Category, Difficulty, ModeId } from './types';

// Some banned words arrive lowercase; capitalize them to match the rest, leaving names like iPhone alone.
function capitalize(word: string): string {
  return /^[a-z](?![A-Z])/.test(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

// A URL-safe id from the word: "Bedtime story" → "bedtime-story", "Café" → "cafe".
export function cardId(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Turn raw bank cards (as stored in @unspoken/content) into entries the dealing functions use.
export function normalizeBank(raw: readonly BankCardInput[]): BankEntry[] {
  return raw.map((c) => ({
    id: cardId(c.word),
    word: c.word,
    banned: c.banned.map(capitalize),
    difficulty: c.difficulty,
    categories: c.themes ?? (c.theme ? [c.theme] : []),
    inAll: c.allCards !== false,
    allWeight: c.allCardsWeight ?? 1,
  }));
}

// The cards a game draws from. All cards (no categories) leaves out names and jargon and weights the
// rest to balance themes; chosen themes use every card in them evenly.
export function cardsFor(bank: readonly BankEntry[], difficulty: Difficulty, categories: readonly Category[]): Card[] {
  if (categories.length === 0) {
    return bank
      .filter((c) => c.difficulty === difficulty && c.inAll && c.allWeight > 0)
      .map(({ id, word, banned, allWeight }) => ({ id, word, banned, weight: allWeight }));
  }
  return bank
    .filter((c) => c.difficulty === difficulty && c.categories.some((t) => categories.includes(t)))
    .map(({ id, word, banned }) => ({ id, word, banned }));
}

// How many cards a difficulty and theme choice draws from (setup shows these counts).
export function deckSize(bank: readonly BankEntry[], difficulty: Difficulty, categories: readonly Category[]): number {
  return cardsFor(bank, difficulty, categories).length;
}

// Themes that have at least one card in this bank, in catalog order.
export function categoriesInBank(bank: readonly BankEntry[], config: GameConfig = gameConfig): Category[] {
  return config.categories.filter((c) => bank.some((card) => card.categories.includes(c)));
}

// The cards a mode actually plays. Escalate needs cards with every banned word; it falls back to
// all the cards while the choice has fewer than escalate.minFullCards of them.
export function playableCards(mode: ModeId, cards: readonly Card[], config: GameConfig = gameConfig): readonly Card[] {
  if (!modeRules(mode, config).escalates) return cards;
  const full = cards.filter((c) => c.banned.length >= config.escalate.max);
  return full.length >= config.escalate.minFullCards ? full : cards;
}
