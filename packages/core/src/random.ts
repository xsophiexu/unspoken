import type { Random } from './types';

const UINT32 = 0x1_0000_0000;

// One step of mulberry32: a small, fast PRNG whose whole state is one uint32, so round state that
// holds a seed stays serializable and replayable (the server and clients can deal the same deck).
export function nextRandom(seed: number): { value: number; seed: number } {
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
