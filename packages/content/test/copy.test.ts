import {
  cardsFor,
  createRound,
  defaultSettings,
  menuStatus,
  roundReducer,
  roundSubline,
  swipeSummary,
  type GameSettings,
  type RoundAction,
  type RoundState,
  type SwipeRoundState,
} from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { bank, copyFor, en, roundCopy } from '../src';

const settings = (overrides: Partial<GameSettings>): GameSettings => ({ ...defaultSettings(), ...overrides });
const start = (s: GameSettings): RoundState =>
  createRound(s, { cards: cardsFor(bank, s.difficulty, s.categories), seed: 1, showIntro: false });
const play = (state: RoundState, actions: RoundAction[]) => actions.reduce(roundReducer, state);
const times = (n: number, action: RoundAction) => Array.from({ length: n }, () => action);

// The shared status lines with the shipped English catalog read like the designs.
describe('status lines in English', () => {
  it('Classic shows points and skips left, singular for one', () => {
    const state = play(start(settings({ mode: 'classic', skips: 3 })), [...times(7, { type: 'correct' }), ...times(2, { type: 'skip' })]);
    expect(roundSubline(state, roundCopy)).toBe('7 pts · 1 skip left');
  });

  it('Endless counts correct and skipped words, and the menu adds the themes', () => {
    const state = start(settings({ mode: 'endless' }));
    expect(roundSubline(state, roundCopy)).toBe('0 correct · 0 skipped');
    expect(menuStatus(state, roundCopy)).toBe('0 correct · 0 skipped · All cards');
  });

  it('Classic’s menu shows the clock and the themes chosen', () => {
    const state = play(start(settings({ mode: 'classic', roundSeconds: 150, categories: ['Society', 'Business'] })), [
      { type: 'tick', seconds: 22 },
      { type: 'correct' },
    ]);
    expect(menuStatus(state, roundCopy)).toBe('2:08 left · 1 pt · 2 themes');
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

  it('a finished Classic round reads singular counts of one', () => {
    const state = play(start(settings({ mode: 'classic', roundSeconds: 30, skips: 3 })), [
      { type: 'correct' },
      { type: 'skip' },
      { type: 'tick', seconds: 30 },
    ]) as SwipeRoundState;
    expect(swipeSummary(state, roundCopy)).toEqual({ label: 'TIME’S UP', value: 1, title: null, sub: 'point · 1 skip' });
  });
});

describe('copyFor', () => {
  it('falls back from a regional tag, or an unknown language, to English', () => {
    expect(copyFor('en-GB')).toBe(en);
    expect(copyFor('xx')).toBe(en);
    expect(copyFor(undefined)).toBe(en);
  });
});
