import { evenHarder, normal } from './data/cards';
import type { Card, Difficulty } from './types';

export const DECKS: Record<Difficulty, { label: string; cards: Card[] }> = {
  normal: { label: 'Normal', cards: normal },
  evenHarder: { label: 'Even Harder', cards: evenHarder },
};

export const TIMER_OPTIONS: (number | null)[] = [null, 60, 90, 120];

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
