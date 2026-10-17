import { describe, expect, it } from 'vitest';

import {
  addPlayer,
  createMindReaderRound,
  createRound,
  currentRoles,
  emptyLineup,
  filledPredictions,
  guessValueNow,
  matchStandings,
  mindReaderCard,
  mindReaderClock,
  mindReaderReducer,
  nextRoles,
  predictionsNeeded,
  roundReducer,
  setStyle,
  spokenClock,
  type Lineup,
  type MindReaderAction,
  type MindReaderRoundState,
  type MindReaderStart,
} from '../src';
import { makeCards, run, settingsFor } from './fixtures';

const cards = makeCards(10);
const named = (...names: string[]): Lineup => names.reduce((l, n) => addPlayer(l, n), emptyLineup());
const teams = setStyle(named('Maya', 'Sam', 'Ava', 'Leo'), 'teams', ['Sharks', 'Owls'].map((name, color) => ({ name, color })));
const start = (mindReader: MindReaderStart, overrides = {}) =>
  createMindReaderRound(settingsFor('mindReader', { roundSeconds: 90, noTimeLimit: false, ...overrides }), { cards, seed: 4, mindReader });
const custom = (rounds = 2, overrides = {}) => start({ play: 'custom', setup: { lineup: teams, rounds } }, overrides);
const play = (state: MindReaderRoundState, actions: MindReaderAction[]) => run(mindReaderReducer, state, actions);
const predictAll = (words = ['Beach', 'Travel', 'Hotel', 'Relax', 'Flight']): MindReaderAction[] => words.map((text, index) => ({ type: 'predict', index, text }));
const toClues: MindReaderAction[] = [{ type: 'showWord' }, ...predictAll(), { type: 'handOff' }, { type: 'startClues' }];
const turn = (guessed: boolean): MindReaderAction[] => [...toClues, { type: 'finishClues', guessed }];

describe('Mind Reader turn', () => {
  it('needs all five predictions, not blanks, before the Clue Giver sees the word', () => {
    const three = play(start({ play: 'quick' }), [{ type: 'showWord' }, ...predictAll(['Beach', '  ', 'Hotel', '', 'Flight'])]);
    expect(predictionsNeeded(three)).toBe(2);
    expect(play(three, [{ type: 'handOff' }]).phase).toBe('predict');
    expect(filledPredictions(play(three, [{ type: 'predict', index: 1, text: ' Travel ' }]))).toEqual(['Beach', 'Travel', 'Hotel', 'Flight']);
  });

  it('walks roles → predict → show → clues', () => {
    const phases = [start({ play: 'quick' })];
    for (const action of toClues) phases.push(mindReaderReducer(phases[phases.length - 1]!, action));
    expect([...new Set(phases.map((s) => s.phase))]).toEqual(['roles', 'predict', 'show', 'clues']);
  });

  it('logs a predicted word each time it is said, with when, and × removes one', () => {
    const clues = play(start({ play: 'quick' }), [...toClues, { type: 'tick', seconds: 14 }, { type: 'spoke', prediction: 0 }, { type: 'tick', seconds: 17 }, { type: 'spoke', prediction: 0 }]);
    expect(clues.spoken).toEqual([
      { prediction: 0, at: 14 },
      { prediction: 0, at: 31 },
    ]);
    expect(play(clues, [{ type: 'unspoke', entry: 0 }]).spoken).toEqual([{ prediction: 0, at: 31 }]);
  });

  it('counts down with a time limit and logs times as time left', () => {
    const clues = play(custom(), [...toClues, { type: 'tick', seconds: 48 }, { type: 'spoke', prediction: 2 }]);
    expect(mindReaderClock(clues)).toBe(42);
    expect(spokenClock(clues, clues.spoken[0]!)).toBe(42);
    expect(guessValueNow(clues)).toBe(7);
  });

  it('ends the turn as not guessed when time runs out', () => {
    const over = play(custom(), [...toClues, { type: 'tick', seconds: 95 }]);
    expect(over.phase).toBe('over');
    expect(over.match!.turns[0]!.result).toMatchObject({ guessed: false, secondsLeft: 0 });
  });

  it('holds the clock while paused', () => {
    const paused = play(custom(), [...toClues, { type: 'pause' }, { type: 'tick', seconds: 30 }]);
    expect(mindReaderClock(paused)).toBe(90);
    expect(mindReaderClock(play(paused, [{ type: 'resume' }, { type: 'tick', seconds: 30 }]))).toBe(60);
  });

  it('counts up with no time limit', () => {
    const clues = play(custom(2, { noTimeLimit: true }), [...toClues, { type: 'tick', seconds: 200 }]);
    expect(clues.phase).toBe('clues');
    expect(mindReaderClock(clues)).toBe(200);
  });

  it('ignores steps out of order', () => {
    const state = start({ play: 'quick' });
    expect(play(state, [{ type: 'startClues' }, { type: 'finishClues', guessed: true }, { type: 'next' }, { type: 'spoke', prediction: 0 }])).toBe(state);
  });
});

describe('Quick play', () => {
  it('has no clock, scores or teams, and plays word after word', () => {
    const state = start({ play: 'quick' });
    expect([state.limit, state.match]).toEqual([null, null]);
    const over = play(state, turn(true));
    expect([over.phase, over.guessed]).toEqual(['over', true]);
    const next = play(over, [{ type: 'next' }]);
    expect([next.phase, next.word, predictionsNeeded(next)]).toEqual(['roles', 2, 5]);
    expect(mindReaderCard(next)!.word).not.toBe(mindReaderCard(state)!.word);
  });
});

describe('Practice', () => {
  it('shows a coach card on each step and ends on how scoring works', () => {
    const state = start({ play: 'practice' });
    expect([state.phase, state.coach]).toEqual(['predict', true]);
    const show = play(state, [{ type: 'dismissCoach' }, ...predictAll(), { type: 'handOff' }]);
    expect([show.phase, show.coach]).toEqual(['show', true]);
    const done = play(show, [{ type: 'startClues' }, { type: 'finishClues', guessed: true }]);
    expect(done.phase).toBe('scoring');
  });
});

describe('Custom game', () => {
  it('falls back to Quick play when the lineup can’t play', () => {
    expect(start({ play: 'custom', setup: { lineup: named('Maya', 'Leo'), rounds: 5 } }).play).toBe('quick');
  });

  it('shows scores between turns and results after the last round', () => {
    let state = custom(1);
    state = play(state, [...turn(true), { type: 'next' }]);
    expect(state.phase).toBe('scores');
    state = play(state, [{ type: 'next' }, ...turn(false), { type: 'next' }]);
    expect(state.phase).toBe('results');
    expect(state.match!.turns).toHaveLength(2);
  });

  it('names this turn’s roles and the next turn’s, and none after the last', () => {
    const state = custom(1);
    const name = (id: string | null) => teams.teams.find((t) => t.id === id)?.name;
    expect([name(currentRoles(state)!.readerTeamId), name(nextRoles(state)!.readerTeamId)]).toEqual(['Sharks', 'Owls']);
    const over = play(state, turn(true));
    expect(name(currentRoles(over)!.readerTeamId)).toBe('Sharks');
    expect(name(nextRoles(over)!.readerTeamId)).toBe('Owls');
    const last = play(over, [{ type: 'next' }, { type: 'next' }, ...turn(true)]);
    expect(nextRoles(last)).toBeNull();
  });

  it('faster guesses score more', () => {
    const fast = play(custom(), [...toClues, { type: 'tick', seconds: 10 }, { type: 'finishClues', guessed: true }]);
    const slow = play(custom(), [...toClues, { type: 'tick', seconds: 80 }, { type: 'finishClues', guessed: true }]);
    const owls = (s: MindReaderRoundState) => matchStandings(s).find((r) => r.side === 't2')!.total;
    expect(owls(fast)).toBeGreaterThan(owls(slow));
  });

  it('Fix this turn rewrites the turn just played and the scores follow', () => {
    const over = play(custom(), [...toClues, { type: 'spoke', prediction: 0 }, { type: 'tick', seconds: 48 }, { type: 'finishClues', guessed: true }]);
    const before = Object.fromEntries(matchStandings(over).map((r) => [r.side, r.total]));
    expect(before).toEqual({ t1: 1, t2: 7 });
    const fixed = play(over, [{ type: 'fixTurn', guessed: false, spoken: over.spoken, predictions: 3 }]);
    expect(Object.fromEntries(matchStandings(fixed).map((r) => [r.side, r.total]))).toEqual({ t1: 6, t2: 0 });
    expect(play(fixed, [{ type: 'next' }, { type: 'fixTurn', guessed: true, spoken: [], predictions: 0 }]).phase).toBe('scores');
  });
});

it('runs through createRound and roundReducer', () => {
  const state = createRound(settingsFor('mindReader'), { cards, seed: 1, mindReader: { play: 'quick' } });
  expect(state.kind).toBe('mindReader');
  expect(roundReducer(state, { type: 'showWord' })).toMatchObject({ phase: 'predict' });
});
