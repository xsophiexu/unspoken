import {
  cardsFor,
  clockLabel,
  createRound,
  defaultSettings,
  menuStatus,
  pausedStatus,
  roundReducer,
  roundStats,
  roundSubline,
  swipeSummary,
  type GameSettings,
  type RoundAction,
  type RoundState,
  type SwipeRoundState,
} from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { bank, roundCopy } from '../src';

const settings = (overrides: Partial<GameSettings>): GameSettings => ({ ...defaultSettings(), ...overrides });
const start = (s: GameSettings): RoundState =>
  createRound(s, { cards: cardsFor(bank, s.difficulties, s.categories), seed: 1, showIntro: false });
const play = (state: RoundState, actions: RoundAction[]) => actions.reduce(roundReducer, state);
const times = (n: number, action: RoundAction) => Array.from({ length: n }, () => action);

// The shared status lines with the shipped English catalog read like the designs.
describe('status lines in English', () => {
  it('Classic shows points and skips left, singular for one', () => {
    const state = play(start(settings({ mode: 'classic', skips: 3 })), [...times(7, { type: 'correct' }), ...times(2, { type: 'skip' })]);
    expect(roundSubline(state, roundCopy)).toBe('7 pts · 1 skip left');
  });

  it('Endless counts correct and skipped words, and the menu adds the categories', () => {
    const state = start(settings({ mode: 'endless' }));
    expect(roundSubline(state, roundCopy)).toBe('0 correct · 0 skipped');
    expect(menuStatus(state, roundCopy)).toBe('0 correct · 0 skipped · All cards');
  });

  it('Classic’s menu shows the clock and the categories chosen', () => {
    const state = play(start(settings({ mode: 'classic', roundSeconds: 150, categories: ['Society', 'Business'] })), [
      { type: 'tick', seconds: 22 },
      { type: 'correct' },
    ]);
    expect(menuStatus(state, roundCopy)).toBe('2:08 left · 1 pt · 2 categories');
  });

  it('Escalate shows the banned words climbing, then progress to the win', () => {
    const climbing = play(start(settings({ mode: 'escalate', skips: 3 })), [{ type: 'correct' }]);
    expect(roundSubline(climbing, roundCopy)).toBe('5 banned words · 3 skips left');
    const top = play(climbing, times(6, { type: 'correct' }));
    expect(roundSubline(top, roundCopy)).toBe('10 banned · 1 of 3 to win · 3 skips left');
  });

  it('Reverse and Mind Reader have their own lines', () => {
    expect(roundSubline(start(settings({ mode: 'reverse' })), roundCopy)).toBe('0 pts · 0 words');
    expect(roundSubline(start(settings({ mode: 'mindReader' })), roundCopy)).toBe('Round 1 · No timer');
  });

  it('splits the score from the rest for styles that show it apart', () => {
    const classic = play(start(settings({ mode: 'classic', skips: 3 })), [...times(7, { type: 'correct' }), ...times(2, { type: 'skip' })]);
    expect(roundStats(classic, roundCopy)).toEqual({ points: 7, detail: '1 skip left' });
    expect(roundStats(start(settings({ mode: 'endless' })), roundCopy)).toEqual({ points: null, detail: '0 correct · 0 skipped' });
    expect(roundStats(start(settings({ mode: 'escalate', skips: 3 })), roundCopy)).toEqual({ points: null, detail: '4 banned words · 3 skips left' });
    expect(roundStats(start(settings({ mode: 'reverse' })), roundCopy)).toEqual({ points: 0, detail: '0 words' });
  });

  it('the clock and the Paused overlay line', () => {
    const classic = play(start(settings({ mode: 'classic', roundSeconds: 150, skips: 3 })), [{ type: 'correct' }, { type: 'skip' }]) as SwipeRoundState;
    expect(clockLabel(classic, roundCopy)).toBe('2:30');
    expect(pausedStatus(classic, roundCopy)).toBe('1 pt · 1 of 3 skips');
    const hot = start(settings({ mode: 'hotPotato' })) as SwipeRoundState;
    expect(clockLabel(hot, roundCopy)).toBe('Hidden');
    expect(pausedStatus(hot, roundCopy)).toBe('0 words passed');
    expect(clockLabel(start(settings({ mode: 'endless' })) as SwipeRoundState, roundCopy)).toBeNull();
  });

  it('a finished Classic round reads singular counts of one', () => {
    const state = play(start(settings({ mode: 'classic', roundSeconds: 30, skips: 3 })), [
      { type: 'correct' },
      { type: 'skip' },
      { type: 'tick', seconds: 30 },
    ]) as SwipeRoundState;
    expect(swipeSummary(state, roundCopy)).toEqual({ label: 'TIME’S UP', value: 1, title: null, sub: 'point · 1 skip' });
  });
});

