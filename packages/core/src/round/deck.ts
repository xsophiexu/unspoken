import { dealDeck, seededRandom } from '../random';
import type { Card } from '../types';

// The deck part of every round: the cards it draws from, the dealt order, the current position and
// the PRNG seed. Kept as plain data so a round can be serialized, sent and replayed.
export type DeckState = {
  pool: readonly Card[];
  order: readonly Card[];
  index: number;
  seed: number;
};

export function newDeck(pool: readonly Card[], seed: number): DeckState {
  const rng = seededRandom(seed);
  const order = dealDeck(pool, rng.random);
  return { pool, order, index: 0, seed: rng.seed() };
}

export function currentCard(deck: DeckState): Card | undefined {
  return deck.order[deck.index];
}

// Move to the next card; when the deck runs out, deal the pool again.
export function advance(deck: DeckState): DeckState {
  if (deck.index + 1 < deck.order.length) return { ...deck, index: deck.index + 1 };
  return newDeck(deck.pool, deck.seed);
}
