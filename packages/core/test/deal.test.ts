import { describe, expect, it } from 'vitest';

import { dealDeck, seededRandom, type Card } from '../src';
import { makeCards } from './fixtures';

function firstCardShare(cards: Card[], deals: number, seed = 1): Map<string, number> {
  const { random } = seededRandom(seed);
  const firsts = new Map<string, number>();
  for (let i = 0; i < deals; i++) {
    const top = dealDeck(cards, random)[0]!;
    firsts.set(top.id, (firsts.get(top.id) ?? 0) + 1);
  }
  return new Map([...firsts].map(([id, n]) => [id, n / deals]));
}

describe('dealDeck', () => {
  it('deals every card exactly once', () => {
    const cards = makeCards(50);
    const deck = dealDeck(cards, seededRandom(7).random);
    expect(deck).toHaveLength(50);
    expect(new Set(deck.map((c) => c.id)).size).toBe(50);
  });

  it('deals the same order for the same seed and a different order for another', () => {
    const cards = makeCards(40);
    const a = dealDeck(cards, seededRandom(42).random).map((c) => c.id);
    const b = dealDeck(cards, seededRandom(42).random).map((c) => c.id);
    const c = dealDeck(cards, seededRandom(43).random).map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('puts unweighted cards first about equally often', () => {
    const cards = makeCards(4);
    const share = firstCardShare(cards, 8000);
    for (const card of cards) expect(share.get(card.id)).toBeCloseTo(0.25, 1);
  });

  it('brings weighted cards up first in proportion to their weight', () => {
    // One card with weight 3 against three with weight 1: it should lead half of all deals.
    const [heavy, ...light] = makeCards(4);
    const cards: Card[] = [{ ...heavy!, weight: 3 }, ...light.map((c) => ({ ...c, weight: 1 }))];
    const share = firstCardShare(cards, 8000);
    expect(share.get(heavy!.id)).toBeGreaterThan(0.47);
    expect(share.get(heavy!.id)).toBeLessThan(0.53);
    for (const card of light) expect(share.get(card.id)).toBeCloseTo(1 / 6, 1);
  });

  it('keeps lightly weighted cards in the deck, just later on average', () => {
    const cards: Card[] = makeCards(20).map((c, i) => ({ ...c, weight: i < 10 ? 0.04 : 0.01 }));
    const { random } = seededRandom(3);
    let heavyPositions = 0;
    let lightPositions = 0;
    for (let i = 0; i < 500; i++) {
      const deck = dealDeck(cards, random);
      expect(deck).toHaveLength(20);
      deck.forEach((c, pos) => {
        if (Number(c.id.split('-')[1]) < 10) heavyPositions += pos;
        else lightPositions += pos;
      });
    }
    expect(heavyPositions).toBeLessThan(lightPositions);
  });
});
