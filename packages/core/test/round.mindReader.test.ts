import { describe, expect, it } from 'vitest';

import {
  createMindReaderRound,
  createRound,
  filledPredictions,
  mindReaderCard,
  mindReaderReducer,
  predictionsNeeded,
  roundReducer,
  type MindReaderAction,
  type MindReaderRoundState,
} from '../src';
import { makeCards, run, settingsFor } from './fixtures';

const cards = makeCards(10);
const start = (showIntro = false) => createMindReaderRound(settingsFor('mindReader'), { cards, seed: 4, showIntro });
const play = (state: MindReaderRoundState, actions: MindReaderAction[]) => run(mindReaderReducer, state, actions);
const predictAll = (words: string[]): MindReaderAction[] => words.map((text, index) => ({ type: 'predict', index, text }));

describe('Mind Reader', () => {
  it('shows the rules the first time, then goes straight to predictions', () => {
    expect(start(true).phase).toBe('intro');
    expect(play(start(true), [{ type: 'start' }]).phase).toBe('predict');
    expect(start(false).phase).toBe('predict');
  });

  it('needs all five predictions before the phone goes to the Clue Giver', () => {
    const three = play(start(), predictAll(['Drink', 'Alcohol', 'Party']));
    expect(predictionsNeeded(three)).toBe(2);
    expect(play(three, [{ type: 'handOff' }]).phase).toBe('predict');
  });

  it('does not count blank predictions', () => {
    const blanks = play(start(), predictAll(['Drink', '  ', 'Party', '', 'Sick']));
    expect(predictionsNeeded(blanks)).toBe(2);
  });

  it('walks predict → hand off → clues → reveal with the guess result', () => {
    const revealed = play(start(), [
      ...predictAll(['Drink', 'Alcohol', 'Party', 'Morning', 'Sick']),
      { type: 'handOff' },
      { type: 'takeOver' },
      { type: 'finishClues', guessed: true },
    ]);
    expect(revealed.phase).toBe('reveal');
    expect(revealed.guessed).toBe(true);
    expect(filledPredictions(revealed)).toEqual(['Drink', 'Alcohol', 'Party', 'Morning', 'Sick']);
  });

  it('shows predictions trimmed on the reveal', () => {
    const state = play(start(), predictAll([' Drink ', 'Alcohol', 'Party', 'Morning', 'Sick ']));
    expect(filledPredictions(state)).toEqual(['Drink', 'Alcohol', 'Party', 'Morning', 'Sick']);
  });

  it('starts the next word with a new card, empty predictions and the next round number', () => {
    const first = start();
    const next = play(first, [
      ...predictAll(['a', 'b', 'c', 'd', 'e']),
      { type: 'handOff' },
      { type: 'takeOver' },
      { type: 'finishClues', guessed: false },
      { type: 'nextWord' },
    ]);
    expect(next.phase).toBe('predict');
    expect(next.round).toBe(2);
    expect(predictionsNeeded(next)).toBe(5);
    expect(mindReaderCard(next)!.word).not.toBe(mindReaderCard(first)!.word);
  });

  it('ignores steps out of order', () => {
    const state = start();
    expect(play(state, [{ type: 'takeOver' }, { type: 'finishClues', guessed: true }, { type: 'nextWord' }])).toBe(state);
    expect(play(state, [{ type: 'predict', index: 9, text: 'x' }])).toBe(state);
  });

  it('runs through createRound and roundReducer', () => {
    const state = createRound(settingsFor('mindReader'), { cards, seed: 1, showIntro: false });
    expect(state.kind).toBe('mindReader');
    expect(roundReducer(state, { type: 'predict', index: 0, text: 'Drink' })).toMatchObject({ predictions: ['Drink', '', '', '', ''] });
  });
});
