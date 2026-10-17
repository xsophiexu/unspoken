import { describe, expect, it } from 'vitest';

import { createReverseRound, createRound, reverseCard, reverseReducer, roundReducer, type ReverseAction, type ReverseRoundState } from '../src';
import { makeCards, run, settingsFor, times } from './fixtures';

const cards = makeCards(20);
const start = (overrides = {}, showIntro = false) => createReverseRound(settingsFor('reverse', overrides), { cards, seed: 3, showIntro });
const play = (state: ReverseRoundState, actions: ReverseAction[]) => run(reverseReducer, state, actions);

describe('Reverse', () => {
  it('opens on the how-to the first time, then goes straight to guessing', () => {
    const first = start({}, true);
    expect(first.phase).toBe('intro');
    expect(play(first, [{ type: 'start' }]).phase).toBe('guess');
    expect(start({}, false).phase).toBe('guess');
  });

  it('shows three clues to start, worth a point more than the hidden ones', () => {
    const view = reverseCard(start({ difficulty: 'Hard' }))!;
    expect(view.total).toBe(6);
    expect(view.clues.filter((c) => c.revealed)).toHaveLength(3);
    expect(view.worth).toBe(4);
  });

  it('uses as many clues as the level shows banned words', () => {
    expect(reverseCard(start({ difficulty: 'Normal' }))!.total).toBe(5);
  });

  it('makes the word worth a point less for each extra clue, down to one point with every clue showing', () => {
    const worths = [];
    let state = start({ difficulty: 'Hard' });
    for (let i = 0; i < 5; i++) {
      worths.push(reverseCard(state)!.worth);
      state = play(state, [{ type: 'revealClue' }]);
    }
    expect(worths).toEqual([4, 3, 2, 1, 1]);
    expect(reverseCard(state)!.canReveal).toBe(false);
  });

  it('scores the word’s worth when the guesser got it', () => {
    const state = play(start(), [{ type: 'revealClue' }, { type: 'showAnswer' }, { type: 'got' }]);
    expect(state.score).toBe(3);
    expect(state.played).toBe(1);
  });

  it('scores nothing for a miss but still counts the word', () => {
    const state = play(start(), [{ type: 'showAnswer' }, { type: 'missed' }]);
    expect(state.score).toBe(0);
    expect(state.played).toBe(1);
  });

  it('starts the next word with three clues, the word hidden and a new card', () => {
    const first = start();
    const next = play(first, [{ type: 'revealClue' }, { type: 'togglePeek' }, { type: 'showAnswer' }, { type: 'got' }]);
    expect(next.phase).toBe('guess');
    expect(next.peek).toBe(false);
    expect(reverseCard(next)!.revealed).toBe(3);
    expect(reverseCard(next)!.card.word).not.toBe(reverseCard(first)!.card.word);
  });

  it('only takes Got it or Missed once the word is shown', () => {
    const guessing = start();
    expect(play(guessing, [{ type: 'got' }, { type: 'missed' }])).toBe(guessing);
  });

  it('stops revealing clues once the answer is shown', () => {
    const answer = play(start(), [{ type: 'showAnswer' }]);
    expect(play(answer, [{ type: 'revealClue' }])).toBe(answer);
  });

  it('toggles the peek at the hidden word while guessing', () => {
    expect(play(start(), [{ type: 'togglePeek' }]).peek).toBe(true);
    expect(play(start(), times(2, { type: 'togglePeek' })).peek).toBe(false);
  });

  it('runs through createRound and roundReducer', () => {
    const state = createRound(settingsFor('reverse'), { cards, seed: 1, showIntro: false });
    expect(state.kind).toBe('reverse');
    expect(roundReducer(state, { type: 'correct' })).toBe(state);
    expect(roundReducer(state, { type: 'showAnswer' })).toMatchObject({ phase: 'answer' });
  });
});
