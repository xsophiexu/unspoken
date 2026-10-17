import { gameConfig, type GameConfig } from './config';
import { dealDeck, seededRandom } from './random';
import { modeRules, toDifficulty } from './rules';
import { DIFFICULTY_IDS, DIFFICULTY_MIN_SCORES, type BankCardInput, type BankEntry, type Card, type Category, type Difficulty, type ModeId } from './types';

// Some banned words arrive lowercase; capitalize them to match the rest, leaving names like iPhone alone.
function capitalize(word: string): string {
  return /^[a-z](?![A-Z])/.test(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

// A URL-safe id from the word: "Bedtime story" → "bedtime-story", "Café" → "cafe".
function cardId(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The level for a familiarity score: 2 is Normal, 3 Tricky, up to 9 and 10 at Legend.
export function difficultyForScore(score: number): Difficulty | undefined {
  if (!Number.isFinite(score)) return undefined;
  return [...DIFFICULTY_IDS].reverse().find((id) => score >= DIFFICULTY_MIN_SCORES[id]) ?? DIFFICULTY_IDS[0];
}

// A bank card's level: from its score, or from its difficulty name (current or legacy) when it has
// no score. The bank file is shared and may still carry the old names.
function cardDifficulty(card: BankCardInput): Difficulty {
  const level = (card.score === undefined ? undefined : difficultyForScore(card.score)) ?? toDifficulty(card.difficulty);
  if (!level) throw new Error(`Word bank card "${card.word}" has no score or known difficulty`);
  return level;
}

// Turn raw bank cards (as stored in @unspoken/content) into entries the dealing functions use.
// Each card's level comes from its score (see cardDifficulty). Ids are unique: a word whose id is
// taken (the same word with or without accents at another level) gets its level appended, so ids
// stay stable as long as the bank keeps its order.
export function normalizeBank(raw: readonly BankCardInput[]): BankEntry[] {
  const taken = new Set<string>();
  const uniqueId = (word: string, difficulty: string) => {
    let id = cardId(word);
    if (taken.has(id)) id = `${id}-${cardId(difficulty)}`;
    for (let n = 2; taken.has(id); n++) id = `${cardId(word)}-${n}`;
    taken.add(id);
    return id;
  };
  return raw.map((c) => {
    const difficulty = cardDifficulty(c);
    return {
      id: uniqueId(c.word, difficulty),
      word: c.word,
      banned: c.banned.map(capitalize),
      difficulty,
      categories: c.themes ?? (c.theme ? [c.theme] : []),
      inAll: c.allCards !== false,
      allWeight: c.allCardsWeight ?? 1,
    };
  });
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

export type DealRequest = {
  difficulty: Difficulty;
  // Empty means All cards.
  categories: readonly Category[];
  // The mode the deck is for; Escalate only plays cards with every banned word. Defaults to Classic.
  mode?: ModeId;
  // How many cards to return; the whole shuffled deck when omitted.
  count?: number;
  seed: number;
};

export type DealtDeck = {
  seed: number;
  // Cards the choice draws from, before `count` is applied.
  total: number;
  cards: Card[];
};

// Deal a deck straight from the bank: the same seed and request always give the same cards, so the
// service and offline clients agree. This is what POST /v1/decks runs.
export function dealFromBank(bank: readonly BankEntry[], request: DealRequest, config: GameConfig = gameConfig): DealtDeck {
  const pool = playableCards(request.mode ?? 'classic', cardsFor(bank, request.difficulty, request.categories), config);
  const deck = dealDeck(pool, seededRandom(request.seed).random);
  const count = request.count === undefined ? deck.length : Math.max(0, Math.floor(request.count));
  return { seed: request.seed >>> 0, total: pool.length, cards: deck.slice(0, count) };
}
