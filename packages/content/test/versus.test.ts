import { addPlayer, createRound, defaultSettings, defaultVersusSetup, emptyLineup, roundReducer, setStyle, versusLineupConfig, type Lineup, type RoundAction, type VersusRoundState, type VersusSetup } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { bank, en, passView, recapView, versusDetails, versusResultsView, versusRoleCards, versusScoresView, versusTitle } from '../src';

const named = (...names: string[]): Lineup => names.reduce((l, n) => addPlayer(l, n, versusLineupConfig()), emptyLineup());
const presets = ['Sharks', 'Owls'].map((name, color) => ({ name, color }));
const teams = setStyle(named('Maya', 'Sam', 'Ava', 'Leo', 'Priya', 'Kai'), 'teams', presets, versusLineupConfig());
const cards = bank.slice(0, 40).map((c) => ({ id: c.id, word: c.word, banned: c.banned }));
const game = (lineup: Lineup, over: Partial<VersusSetup> = {}) =>
  createRound({ ...defaultSettings(), mode: 'versus' }, { cards, seed: 1, versus: { ...defaultVersusSetup(lineup), ...over } }) as VersusRoundState;
const play = (s: VersusRoundState, actions: RoundAction[]) => actions.reduce(roundReducer, s) as VersusRoundState;
const idOf = (lineup: Lineup, name: string) => lineup.players.find((p) => p.name === name)!.id;

describe('Versus screens in English', () => {
  it('Teams: the pass screen names the team, the Clue Giver and who watches', () => {
    const s = game(teams);
    expect(passView(s)).toMatchObject({
      kicker: 'Round 1 of 5',
      title: 'Sharks’ turn',
      sub: 'Maya gives clues',
      note: 'Hand the phone to Maya. Only Maya looks at the card.',
      nextTime: 'Next time, Sam gives clues for Sharks.',
      button: 'Maya is ready · Start',
    });
    expect(passView(s).rows).toEqual([
      { label: 'CLUE GIVER', value: 'Maya' },
      { label: 'GUESSING', value: 'Sam and Ava' },
      { label: 'WATCHING FOR BANNED WORDS', value: 'Owls' },
    ]);
  });

  it('Teams: the turn header and Details', () => {
    const s = play(game(teams), [{ type: 'startTurn' }]);
    expect(versusTitle(s)).toBe('Round 1 of 5');
    expect(versusRoleCards(s)).toEqual([
      { label: 'Sharks are up', value: 'Maya gives clues' },
      { label: 'Guessing', value: 'Sam, Ava' },
    ]);
    const d = versusDetails(s);
    expect(d.sections.map((x) => [x.label, x.team?.name, x.names])).toEqual([
      ['CLUE GIVER', 'Sharks', ['Maya']],
      ['GUESSING', 'Sharks', ['Sam', 'Ava']],
      ['WATCHING FOR BANNED WORDS', 'Owls', ['Leo', 'Priya', 'Kai']],
    ]);
    expect(d.footer).toBe('Next turn: Owls are up · Leo gives clues.');
  });

  it('Teams: the recap reads like the board, and a tap changes the row and the total', () => {
    const recap = play(game(teams, { penalty: true }), [
      { type: 'startTurn' },
      { type: 'correct' },
      { type: 'correct' },
      { type: 'skip' },
      { type: 'correct' },
      { type: 'tick', seconds: 60 },
    ]);
    const v = recapView(recap)!;
    expect(v).toMatchObject({ kicker: 'Round 1 of 5 · Sharks', title: 'Turn recap', scored: 'Sharks scored', total: '+3', hint: 'Tap a word to change it', button: 'Next: Owls’ turn' });
    expect(v.counts.map((c) => c.label)).toEqual(['3 correct', '2 not guessed', '0 banned words']);
    expect(v.rows.map((r) => [r.label, r.points, r.who])).toEqual([
      ['Correct', '+1', null],
      ['Correct', '+1', null],
      ['Not guessed', '0', null],
      ['Correct', '+1', null],
      ['Not guessed', '0', en.versus.recap.timeUp],
    ]);
    const banned = recapView(play(recap, [{ type: 'cycleCard', index: 2 }]))!;
    expect([banned.rows[2]!.label, banned.rows[2]!.points, banned.total]).toEqual(['Banned word', '−1', '+2']);
    expect(banned.counts.map((c) => c.label)).toEqual(['3 correct', '1 not guessed', '1 banned word']);
  });

  it('Teams: scores between rounds and the winner', () => {
    const turn = (n: number): RoundAction[] => [{ type: 'startTurn' }, ...Array.from({ length: n }, () => ({ type: 'correct' }) as const), { type: 'endTurn' }, { type: 'next' }];
    const scores = play(game(teams, { rounds: 2 }), [...turn(3), ...turn(1)]);
    expect(versusScoresView(scores)).toMatchObject({
      kicker: 'After round 1 of 2',
      left: '1 round left.',
      next: 'Sharks are up · Sam gives clues',
      hand: 'Hand the phone to Sam.',
      button: 'Start Sharks’ turn',
    });
    expect(versusScoresView(scores)?.rows.map((r) => [r.name, r.total, r.last])).toEqual([
      ['Sharks', 3, '+3'],
      ['Owls', 1, '+1'],
    ]);
    const done = play(scores, [{ type: 'next' }, ...turn(2), ...turn(0)]);
    expect(versusResultsView(done)).toMatchObject({ kicker: 'Game over · 2 rounds', title: 'Sharks win', sub: '5 points · 5 correct' });
  });

  it('Individual with 3+: who got it shows on the recap; the results split the points', () => {
    const four = named('Maya', 'Sam', 'Leo', 'Ava');
    const s = play(game(four, { rounds: 1, penalty: true }), [
      { type: 'startTurn' },
      { type: 'correct', guesser: idOf(four, 'Sam') },
      { type: 'skip' },
      { type: 'endTurn' },
    ]);
    expect(versusRoleCards(play(game(four), [{ type: 'startTurn' }]))).toEqual([
      { label: 'Clue Giver', value: 'Maya' },
      { label: 'Guessing', value: 'Sam, Leo, Ava' },
    ]);
    const v = recapView(play(s, [{ type: 'cycleCard', index: 1 }]))!;
    expect(v.kicker).toBe('Round 1 of 1 · Maya gave clues');
    // The card on screen when the turn ended counts too, as Not guessed.
    expect(v.rows.map((r) => [r.label, r.who])).toEqual([
      ['Correct', 'Sam'],
      ['Banned word', null],
      ['Not guessed', null],
    ]);
    expect(v.scored).toBe('Maya scored');
    expect(v.total).toBe('0');
    const done = play(s, [{ type: 'cycleCard', index: 1 }, { type: 'next' }, ...[1, 2, 3].flatMap((): RoundAction[] => [{ type: 'startTurn' }, { type: 'endTurn' }, { type: 'next' }])]);
    expect(versusResultsView(done)).toMatchObject({ title: 'Sam wins', sub: '1 point · 0 as Clue Giver, 1 guessing' });
    expect(versusResultsView(done).rows.find((r) => r.name === 'Maya')).toMatchObject({ total: 0 });
  });

  it('Individual with 2: Clue Giver and Guesser', () => {
    const pair = named('Maya', 'Leo');
    const s = game(pair);
    expect(passView(s)).toMatchObject({ title: 'Maya’s turn', sub: 'Leo guesses', nextTime: null });
    expect(versusRoleCards(play(s, [{ type: 'startTurn' }]))).toEqual([
      { label: 'Clue Giver', value: 'Maya' },
      { label: 'Guesser', value: 'Leo' },
    ]);
  });
});
