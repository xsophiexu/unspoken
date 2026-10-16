import type { Card, Random } from './types';

// Fisher–Yates shuffle into a new array.
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

// Deal a deck with no repeats. Weighted cards come up earlier in proportion to their weight
// (each gets the key random^(1 / weight), highest first); unweighted cards are shuffled evenly.
export function dealDeck(cards: readonly Card[], random: Random): Card[] {
  if (!cards.some((c) => c.weight !== undefined)) return shuffle(cards, random);
  return cards
    .map((card) => ({ card, key: Math.pow(random(), 1 / (card.weight ?? 1)) }))
    .sort((a, b) => b.key - a.key)
    .map(({ card }) => card);
}
