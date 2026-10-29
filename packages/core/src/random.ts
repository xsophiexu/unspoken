import type { Card, Random } from './types';

const UINT32 = 0x1_0000_0000;

// One step of mulberry32: a small, fast PRNG whose whole state is one uint32, so round state that
// holds a seed stays serializable and replayable (the server and clients can deal the same deck).
function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / UINT32, seed: next >>> 0 };
}

// A Random that draws from a seed. Read `seed()` afterwards to continue the same sequence later.
export function seededRandom(seed: number): { random: Random; seed: () => number } {
  let state = seed >>> 0;
  return {
    random: () => {
      const step = nextRandom(state);
      state = step.seed;
      return step.value;
    },
    seed: () => state,
  };
}

// A fresh uint32 seed. Platforms call this (with Math.random by default) when a game starts.
export function newSeed(random: Random = Math.random): number {
  return Math.floor(random() * UINT32) >>> 0;
}

// Fisher–Yates shuffle into a new array.
function shuffle<T>(items: readonly T[], random: Random): T[] {
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

// Deal easiest first (Deep dive): the groups in the order given, each dealt as dealDeck deals, one
// after another. Pass the cards grouped by difficulty, easiest first (cardsByDifficulty), so every
// Normal card comes before any Tricky card, and so on up to Legend.
export function dealEasiestFirst(groups: readonly (readonly Card[])[], random: Random): Card[] {
  return groups.flatMap((group) => dealDeck(group, random));
}
