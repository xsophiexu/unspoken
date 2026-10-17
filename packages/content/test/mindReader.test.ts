import { addPlayer, createMindReaderRound, defaultSettings, emptyLineup, mindReaderReducer, setStyle, type Lineup, type MindReaderAction, type MindReaderRoundState } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { bank, cluesView, detailsSheet, overView, predictView, resultsView, roleCards, rolesView, scoresView, showView, turnTitle } from '../src';

const named = (...names: string[]): Lineup => names.reduce((l, n) => addPlayer(l, n), emptyLineup());
const teams = setStyle(named('Maya', 'Sam', 'Ava', 'Leo', 'Priya', 'Kai'), 'teams', ['Sharks', 'Owls'].map((name, color) => ({ name, color })));
const cards = bank.slice(0, 20).map((c) => ({ id: c.id, word: c.word, banned: c.banned }));
const game = (lineup: Lineup, rounds = 5) =>
  createMindReaderRound({ ...defaultSettings(), mode: 'mindReader', roundSeconds: 90, noTimeLimit: false }, { cards, seed: 1, mindReader: { play: 'custom', setup: { lineup, rounds } } });
const play = (s: MindReaderRoundState, actions: MindReaderAction[]) => actions.reduce(mindReaderReducer, s);
const predict = ['Beach', 'Travel', 'Hotel', 'Relax', 'Flight'].map((text, index): MindReaderAction => ({ type: 'predict', index, text }));
const toClues: MindReaderAction[] = [{ type: 'showWord' }, ...predict, { type: 'handOff' }, { type: 'startClues' }];

describe('Mind Reader screens in English', () => {
  it('Teams: roles, header cards and the predict and show screens name the right people', () => {
    const state = game(teams);
    expect(rolesView(state)).toMatchObject({ kicker: 'Round 1 of 5', title: 'Sharks’ turn', button: 'Show the Mind Readers the word' });
    expect(rolesView(state).cards.map((c) => c.detail)).toEqual(['Maya, Sam and Ava · predict together', 'From Owls · gives clues without the phone', 'Priya and Kai · guess out loud']);
    expect(turnTitle(state)).toBe('Round 1 of 5');
    expect(roleCards(state)).toEqual([
      { label: 'Mind Readers', value: 'Sharks' },
      { label: 'Owls are up', value: 'Leo gives clues' },
    ]);
    const predicting = play(state, [{ type: 'showWord' }]);
    expect(predictView(predicting)).toMatchObject({ kicker: 'Sharks, the word is', hint: 'Words Leo might say', note: 'Don’t let Owls see or hear.', button: 'Write 5 more' });
    const showing = play(predicting, [...predict, { type: 'handOff' }]);
    expect(showView(showing)).toMatchObject({ title: 'Show Leo the word', guessers: 'Priya and Kai are guessing: don’t show them.', gives: 'Leo gives clues without the phone.', button: 'Leo has seen it and looked away' });
  });

  it('Teams: the clues, the turn over and the scores read like the board', () => {
    const clues = play(game(teams), [...toClues, { type: 'tick', seconds: 10 }, { type: 'spoke', prediction: 3 }, { type: 'tick', seconds: 38 }]);
    expect(cluesView(clues)).toMatchObject({ clock: '0:42', guessNow: 'Owls guess now: 3 + 4 = 7 points', correct: '1 correct prediction', guessed: 'Owls guessed it!', notGuessed: null });
    expect(cluesView(clues).spoken.map((r) => r.label)).toEqual(['1:20 · Relax']);
    expect(detailsSheet(clues)?.footer).toBe('Next turn: Owls are the Mind Readers.');
    const over = play(clues, [{ type: 'finishClues', guessed: true }]);
    expect(overView(over)?.kicker).toBe('Owls guessed it with 0:42 left');
    expect(overView(over)?.sides.map((s) => [s.name, s.total])).toEqual([
      ['Owls', '+7'],
      ['Sharks', '+1'],
    ]);
    const scores = scoresView(play(over, [{ type: 'next' }]));
    expect(scores).toMatchObject({ kicker: 'Round 1 of 5', next: 'Owls are the Mind Readers', nextClues: 'Maya (Sharks) gives clues · Sam and Ava guess', hand: 'Hand the phone to Owls.', button: 'Start Owls’ turn' });
  });

  it('Individual: no team names; the next Mind Reader is this turn’s Clue Giver', () => {
    const state = game(named('Maya', 'Leo', 'Priya', 'Kai'));
    expect(roleCards(state)).toEqual([
      { label: 'Mind Reader', value: 'Maya' },
      { label: 'Clue Giver', value: 'Leo' },
    ]);
    expect(rolesView(state).title).toBe('Maya’s turn');
    expect(detailsSheet(state)?.footer).toBe('Next turn: Leo is the Mind Reader.');
    expect(cluesView(play(state, toClues)).guessNow).toBe('Guess now: 3 + 9 = 12 points');
  });

  // Each Clue Giver scores 12 for a guess with 1:30 left; Priya also had a prediction said.
  it('names the winner after the last round', () => {
    const one = play(game(named('Maya', 'Leo', 'Priya'), 1), [
      ...toClues,
      { type: 'finishClues', guessed: true },
      { type: 'next' },
      { type: 'next' },
      ...toClues,
      { type: 'finishClues', guessed: true },
      { type: 'next' },
      { type: 'next' },
      ...toClues,
      { type: 'spoke', prediction: 0 },
      { type: 'finishClues', guessed: true },
      { type: 'next' },
    ]);
    expect(one.phase).toBe('results');
    expect(resultsView(one)).toMatchObject({ kicker: 'Game over · 1 round', title: 'Priya wins', sub: '13 points · 1 correct prediction' });
  });
});
