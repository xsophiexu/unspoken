import { describe, expect, it } from 'vitest';

import {
  bannedShown,
  canAnswer,
  clockProgress,
  createRound,
  createSwipeRound,
  hotPotatoRange,
  isClockRunning,
  isSwipeOver,
  isSwipeWon,
  roundReducer,
  skipsLeft,
  swipeCard,
  swipeReducer,
  type SwipeAction,
  type SwipeRoundState,
} from '../src';
import { makeCards, run, settingsFor, times } from './fixtures';

const cards = makeCards(30);
const start = (mode: Parameters<typeof settingsFor>[0], overrides = {}, seed = 1) =>
  createSwipeRound(settingsFor(mode, overrides), { cards, seed });
const play = (state: SwipeRoundState, actions: SwipeAction[]) => run(swipeReducer, state, actions);
const word = (state: SwipeRoundState) => swipeCard(state)!.card.word;

describe('Classic', () => {
  const classic = () => start('classic', { roundSeconds: 60, skips: 2, difficulty: 'Hard' });

  it('scores a correct answer and moves to the next card', () => {
    const before = classic();
    const after = play(before, [{ type: 'correct' }]);
    expect(after.correct).toBe(1);
    expect(word(after)).not.toBe(word(before));
  });

  it('counts down the round skips and refuses a skip when none are left', () => {
    const twoSkipped = play(classic(), [{ type: 'skip' }, { type: 'skip' }]);
    expect(skipsLeft(twoSkipped)).toBe(0);
    expect(canAnswer(twoSkipped, 'skip')).toBe(false);
    const refused = play(twoSkipped, [{ type: 'skip' }]);
    expect(refused).toBe(twoSkipped);
    expect(canAnswer(twoSkipped, 'correct')).toBe(true);
  });

  it('treats an ∞ skip setting as unlimited', () => {
    const state = play(start('classic', { skips: null }), times(12, { type: 'skip' }));
    expect(state.skipped).toBe(12);
    expect(skipsLeft(state)).toBeNull();
  });

  it('runs the clock down with ticks and ends the round at zero', () => {
    const almost = play(classic(), times(59, { type: 'tick' }));
    expect(almost.clock?.left).toBe(1);
    expect(isSwipeOver(almost)).toBe(false);
    const done = play(almost, [{ type: 'tick' }]);
    expect(isSwipeOver(done)).toBe(true);
    expect(isClockRunning(done)).toBe(false);
  });

  it('ignores answers once time is up', () => {
    const done = play(classic(), [{ type: 'tick', seconds: 60 }]);
    expect(play(done, [{ type: 'correct' }, { type: 'skip' }])).toBe(done);
  });

  it('stops the clock and ignores answers while paused, a menu or a sheet is open', () => {
    for (const reason of ['user', 'menu', 'sheet'] as const) {
      const paused = play(classic(), [{ type: 'pause', reason }]);
      expect(isClockRunning(paused)).toBe(false);
      expect(play(paused, [{ type: 'tick' }, { type: 'correct' }])).toBe(paused);
      const resumed = play(paused, [{ type: 'resume' }, { type: 'tick' }]);
      expect(resumed.clock?.left).toBe(59);
    }
  });

  it('shows the level’s banned words on each card', () => {
    expect(swipeCard(classic())!.banned).toHaveLength(6);
    expect(swipeCard(start('classic', { difficulty: 'Normal' }))!.banned).toHaveLength(5);
  });

  it('drains the timer share as the round runs', () => {
    const half = play(classic(), [{ type: 'tick', seconds: 30 }]);
    expect(clockProgress(classic())).toBe(1);
    expect(clockProgress(half)).toBe(0.5);
  });
});

describe('Endless', () => {
  it('has no clock: ticks change nothing and the round never ends', () => {
    const state = start('endless');
    expect(state.clock).toBeNull();
    expect(isClockRunning(state)).toBe(false);
    expect(play(state, [{ type: 'tick', seconds: 999 }])).toBe(state);
    expect(isSwipeOver(play(state, times(100, { type: 'correct' })))).toBe(false);
  });

  it('has no skip limit, whatever the skip setting says, and counts skips', () => {
    const state = play(start('endless', { skips: 0 }), times(5, { type: 'skip' }));
    expect(state.skipped).toBe(5);
    expect(skipsLeft(state)).toBeNull();
  });
});

describe('Time Attack', () => {
  it('adds 5 seconds for every correct answer', () => {
    const state = play(start('timeAttack', { roundSeconds: 30 }), [{ type: 'tick', seconds: 10 }, { type: 'correct' }]);
    expect(state.clock?.left).toBe(25);
  });

  it('grows the ring’s full length when bonuses pass the starting time, so progress never exceeds 1', () => {
    const state = play(start('timeAttack', { roundSeconds: 30 }), [{ type: 'correct' }, { type: 'correct' }]);
    expect(state.clock).toEqual({ left: 40, total: 40 });
    expect(clockProgress(state)).toBe(1);
  });

  it('does not add time for a skip', () => {
    const state = play(start('timeAttack', { roundSeconds: 30 }), [{ type: 'skip' }]);
    expect(state.clock?.left).toBe(30);
  });
});

describe('Escalate', () => {
  it('has no clock', () => {
    expect(start('escalate').clock).toBeNull();
  });

  it('starts with 4 banned words and adds one per correct answer up to 10', () => {
    let state = start('escalate', { skips: null });
    const shown = [bannedShown(state)];
    for (let i = 0; i < 8; i++) {
      state = play(state, [{ type: 'correct' }]);
      shown.push(bannedShown(state));
    }
    expect(shown).toEqual([4, 5, 6, 7, 8, 9, 10, 10, 10]);
    expect(swipeCard(state)!.banned).toHaveLength(10);
  });

  it('does not add a banned word for a skip', () => {
    expect(bannedShown(play(start('escalate'), [{ type: 'skip' }]))).toBe(4);
  });

  it('marks the word added by the last correct answer as new until the top level', () => {
    expect(swipeCard(start('escalate'))!.freshIndex).toBeNull();
    expect(swipeCard(play(start('escalate'), [{ type: 'correct' }]))!.freshIndex).toBe(4);
    expect(swipeCard(play(start('escalate'), times(6, { type: 'correct' })))!.freshIndex).toBe(9);
    expect(swipeCard(play(start('escalate'), times(7, { type: 'correct' })))!.freshIndex).toBeNull();
  });

  it('is won with 3 correct answers once all 10 banned words show', () => {
    const atTop = play(start('escalate'), times(6, { type: 'correct' }));
    const twoMore = play(atTop, times(2, { type: 'correct' }));
    expect(isSwipeWon(twoMore)).toBe(false);
    const won = play(twoMore, [{ type: 'correct' }]);
    expect(isSwipeWon(won)).toBe(true);
    expect(isSwipeOver(won)).toBe(true);
    expect(play(won, [{ type: 'correct' }])).toBe(won);
  });

  it('keeps the skip limit', () => {
    const state = play(start('escalate', { skips: 1 }), [{ type: 'skip' }]);
    expect(canAnswer(state, 'skip')).toBe(false);
  });

  it('plays only cards with all ten banned words when there are enough', () => {
    const mixed = [...makeCards(25, 10), ...makeCards(25, 6).map((c) => ({ ...c, id: `short-${c.id}` }))];
    let state = createSwipeRound(settingsFor('escalate', { skips: null }), { cards: mixed, seed: 5 });
    for (let i = 0; i < 40; i++) {
      expect(swipeCard(state)!.card.banned).toHaveLength(10);
      state = play(state, [{ type: 'skip' }]);
    }
  });
});

describe('Hot Potato', () => {
  it('hides a clock whose length falls in the level’s range, ignoring the round timer setting', () => {
    for (const difficulty of ['Normal', 'Hard', 'Legend'] as const) {
      const { min, max } = hotPotatoRange(difficulty);
      for (let seed = 0; seed < 50; seed++) {
        const state = start('hotPotato', { difficulty, roundSeconds: 5 }, seed);
        expect(state.clock!.left).toBeGreaterThanOrEqual(min);
        expect(state.clock!.left).toBeLessThanOrEqual(max);
      }
    }
  });

  it('never shows progress on the ring', () => {
    expect(clockProgress(start('hotPotato'))).toBe(0);
  });

  it('asks to pass the phone after a correct answer, holding the clock until the next player is ready', () => {
    const passing = play(start('hotPotato'), [{ type: 'correct' }]);
    expect(passing.passing).toBe(true);
    expect(isClockRunning(passing)).toBe(false);
    expect(play(passing, [{ type: 'tick' }, { type: 'correct' }])).toBe(passing);
    const ready = play(passing, [{ type: 'ready' }]);
    expect(ready.passing).toBe(false);
    expect(isClockRunning(ready)).toBe(true);
  });

  it('lets the same player skip to a new word without passing the phone', () => {
    const skipped = play(start('hotPotato'), [{ type: 'skip' }]);
    expect(skipped.passing).toBe(false);
    expect(isClockRunning(skipped)).toBe(true);
    expect(skipped.deck).not.toEqual(start('hotPotato').deck);
  });

  it('ends when the hidden time runs out', () => {
    const state = start('hotPotato');
    expect(isSwipeOver(play(state, [{ type: 'tick', seconds: state.clock!.left }]))).toBe(true);
  });
});

describe('dealing within a round', () => {
  it('plays every card once before any repeats, then deals again', () => {
    let state = start('endless');
    const seen: string[] = [];
    for (let i = 0; i < 30; i++) {
      seen.push(word(state));
      state = play(state, [{ type: 'correct' }]);
    }
    expect(new Set(seen).size).toBe(30);
    expect(swipeCard(state)).not.toBeNull();
  });

  it('deals the same words for the same seed', () => {
    const words = (seed: number) => {
      let state = start('endless', {}, seed);
      return Array.from({ length: 40 }, () => {
        const w = word(state);
        state = play(state, [{ type: 'skip' }]);
        return w;
      });
    };
    expect(words(9)).toEqual(words(9));
    expect(words(9)).not.toEqual(words(10));
  });
});

describe('createRound / roundReducer', () => {
  it('pick the swipe machine for swipe modes and ignore actions it does not know', () => {
    const state = createRound(settingsFor('classic'), { cards, seed: 1 });
    expect(state.kind).toBe('swipe');
    expect(roundReducer(state, { type: 'revealClue' })).toBe(state);
    expect(roundReducer(state, { type: 'correct' })).not.toBe(state);
  });

  it('refuse modes that are not available', () => {
    expect(() => createRound(settingsFor('teams'), { cards, seed: 1 })).toThrow();
  });
});
