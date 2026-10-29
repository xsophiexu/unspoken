import { dealDeck, dealEasiestFirst, seededRandom } from '../random';
import type { Card } from '../types';

// The deck part of every round: the cards it draws from, the dealt order, the current position and
// the PRNG seed. Kept as plain data so a round can be serialized, sent and replayed.
export type DeckState = {
  pool: readonly Card[];
  order: readonly Card[];
  index: number;
  seed: number;
  // Easiest first: the pool grouped by difficulty, easiest first. Each deal goes through the groups
  // in turn (dealEasiestFirst) instead of shuffling the pool together.
  groups?: readonly (readonly Card[])[];
};

// A fresh deal of the pool, or of the groups in turn when there are some (the pool is then their cards).
export function newDeck(pool: readonly Card[], seed: number, groups?: readonly (readonly Card[])[]): DeckState {
  const rng = seededRandom(seed);
  if (groups) return { pool, order: dealEasiestFirst(groups, rng.random), index: 0, seed: rng.seed(), groups };
  return { pool, order: dealDeck(pool, rng.random), index: 0, seed: rng.seed() };
}

export function currentCard(deck: DeckState): Card | undefined {
  return deck.order[deck.index];
}

// Move to the next card; when the deck runs out, deal the pool again.
export function advance(deck: DeckState): DeckState {
  if (deck.index + 1 < deck.order.length) return { ...deck, index: deck.index + 1 };
  return newDeck(deck.pool, deck.seed, deck.groups);
}

// Show this card now (a card picked from search). The card that was showing comes right after it,
// and the rest of the deck follows as dealt.
export function showNow(deck: DeckState, card: Card): DeckState {
  return { ...deck, order: [...deck.order.slice(0, deck.index), card, ...deck.order.slice(deck.index)] };
}
