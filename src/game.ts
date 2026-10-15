import { easy, evenHarder, hard } from './data/cards';
import type { Card, Difficulty, GameSettings, ModeId } from './types';

export const DIFFICULTIES: { id: Difficulty; name: string; badge: string; sub: string; cards: Card[] }[] = [
  { id: 'easy', name: 'Easy', badge: 'EASY', sub: 'Everyday words', cards: easy },
  { id: 'hard', name: 'Hard', badge: 'HARD', sub: 'Trickier words', cards: hard },
  { id: 'evenHarder', name: 'Even harder', badge: 'EVEN HARDER', sub: 'Expert level', cards: evenHarder },
];

export type Mode = {
  id: ModeId;
  name: string;
  sub: string;
  timed: boolean;
  scored: boolean;
  // Seconds added to the clock for each correct answer.
  bonusSeconds?: number;
  available: boolean;
};

// Order matches the Modes grid in the design canvas.
export const MODES: Mode[] = [
  { id: 'classic', name: 'Classic', sub: 'Timed round, score what you can', timed: true, scored: true, available: true },
  { id: 'endless', name: 'Endless', sub: 'No clock, go until you stop', timed: false, scored: true, available: true },
  { id: 'teams', name: 'Teams', sub: 'Two teams, pass the phone', timed: true, scored: true, available: false },
  { id: 'timeAttack', name: 'Time attack', sub: 'Correct answers add time', timed: true, scored: true, bonusSeconds: 5, available: true },
  { id: 'escalate', name: 'Escalate', sub: 'More banned words each level', timed: true, scored: true, available: false },
  { id: 'hotPotato', name: 'Hot potato', sub: 'Hidden timer, pass it on', timed: true, scored: false, available: false },
  { id: 'zen', name: 'Zen', sub: 'No score, no clock', timed: false, scored: false, available: true },
  { id: 'reverse', name: 'Reverse', sub: 'Guess the word from its clues', timed: false, scored: true, available: false },
];

export const SKIP_OPTIONS: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null];

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'classic',
  difficulty: 'hard',
  roundSeconds: 60,
  skips: 3,
};

export function modeOf(id: ModeId): Mode {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

export function difficultyOf(id: Difficulty) {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

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
