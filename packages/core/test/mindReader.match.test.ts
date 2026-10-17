import { describe, expect, it } from 'vitest';

import {
  addPlayer,
  emptyLineup,
  endsRound,
  fixTurn,
  guessPoints,
  roundOfTurn,
  setStyle,
  setTeamCount,
  standings,
  totalTurns,
  turnPoints,
  turnRoles,
  winners,
  type Lineup,
  type PlayedTurn,
  type TurnResult,
} from '../src';

const presets = ['Sharks', 'Owls', 'Foxes'].map((name, color) => ({ name, color }));
const named = (...names: string[]): Lineup => names.reduce((l, n) => addPlayer(l, n), emptyLineup());
const nameOf = (lineup: Lineup, id: string) => lineup.players.find((p) => p.id === id)!.name;
const teamName = (lineup: Lineup, id: string | null) => lineup.teams.find((t) => t.id === id)?.name;
const individual = named('Maya', 'Leo', 'Priya');
const twoTeams = setStyle(named('Maya', 'Sam', 'Ava', 'Leo', 'Priya', 'Kai'), 'teams', presets);
const result = (r: Partial<TurnResult>): TurnResult => ({ guessed: true, secondsLeft: null, spoken: [], extra: 0, ...r });
const said = (n: number) => Array.from({ length: n }, (_, i) => ({ prediction: i % 5, at: i * 5 }));

describe('Mind Reader turn rotation', () => {
  it('Individual: the next player gives clues, the rest guess, and the Clue Giver reads next', () => {
    const roles = [0, 1, 2, 3].map((t) => turnRoles(individual, t));
    expect(roles.map((r) => [nameOf(individual, r.mindReaders[0]!), nameOf(individual, r.clueGiver), r.guessers.map((g) => nameOf(individual, g))])).toEqual([
      ['Maya', 'Leo', ['Priya']],
      ['Leo', 'Priya', ['Maya']],
      ['Priya', 'Maya', ['Leo']],
      ['Maya', 'Leo', ['Priya']],
    ]);
  });

  it('Teams: teams take turns predicting; the next team gives clues, its players taking turns', () => {
    const roles = [0, 1, 2, 3, 4, 5].map((t) => turnRoles(twoTeams, t));
    expect(
      roles.map((r) => [teamName(twoTeams, r.readerTeamId), teamName(twoTeams, r.clueTeamId), nameOf(twoTeams, r.clueGiver), r.guessers.map((g) => nameOf(twoTeams, g))]),
    ).toEqual([
      ['Sharks', 'Owls', 'Leo', ['Priya', 'Kai']],
      ['Owls', 'Sharks', 'Maya', ['Sam', 'Ava']],
      ['Sharks', 'Owls', 'Priya', ['Leo', 'Kai']],
      ['Owls', 'Sharks', 'Sam', ['Maya', 'Ava']],
      ['Sharks', 'Owls', 'Kai', ['Leo', 'Priya']],
      ['Owls', 'Sharks', 'Ava', ['Maya', 'Sam']],
    ]);
  });

  it('Teams of three: the team after the Mind Readers is up, the third sits out', () => {
    const three = setTeamCount(twoTeams, 3, presets);
    const r = turnRoles(three, 2);
    expect([teamName(three, r.readerTeamId), teamName(three, r.clueTeamId)]).toEqual(['Foxes', 'Sharks']);
    expect([...r.mindReaders, r.clueGiver, ...r.guessers]).toHaveLength(4);
  });

  it('every team plays once a round, and the game lasts rounds × teams turns', () => {
    expect(totalTurns({ lineup: twoTeams, rounds: 5 })).toBe(10);
    expect(totalTurns({ lineup: individual, rounds: 5 })).toBe(15);
    expect([0, 1, 2, 3].map((t) => roundOfTurn(twoTeams, t))).toEqual([1, 1, 2, 2]);
    expect([0, 1, 2].map((t) => endsRound(twoTeams, t))).toEqual([false, true, false]);
  });
});

describe('Mind Reader scoring', () => {
  it('a guess scores 3 plus 1 for every 10 seconds left; a flat 3 with no time limit', () => {
    expect(guessPoints(42)).toBe(7);
    expect(guessPoints(9)).toBe(3);
    expect(guessPoints(null)).toBe(3);
  });

  it('the Mind Readers score every prediction said, repeats too, and 3 more when it isn’t guessed', () => {
    expect(turnPoints(result({ secondsLeft: 42, spoken: said(4) }))).toMatchObject({ clueSide: 7, readerSide: 4 });
    expect(turnPoints(result({ guessed: false, secondsLeft: 0, spoken: said(2) }))).toMatchObject({ clueSide: 0, readerSide: 5 });
  });

  it('adds up standings by team, highest first, with the latest turn’s points', () => {
    const turns: PlayedTurn[] = [
      { roles: turnRoles(twoTeams, 0), word: 'Vacation', result: result({ secondsLeft: 42, spoken: said(4) }) },
      { roles: turnRoles(twoTeams, 1), word: 'Ladder', result: result({ guessed: false, secondsLeft: 0, spoken: said(1) }) },
    ];
    const rows = standings(twoTeams, turns);
    // Owls: 7 for their guess, then 1 prediction and 3 for Sharks missing theirs.
    expect(rows.map((r) => [teamName(twoTeams, r.side), r.total, r.last, r.predictions])).toEqual([
      ['Owls', 11, 4, 1],
      ['Sharks', 4, 0, 4],
    ]);
  });

  it('scores Individual games per player: the Clue Giver takes the guess, the Mind Reader the predictions', () => {
    const turns: PlayedTurn[] = [{ roles: turnRoles(individual, 0), word: 'Vacation', result: result({ secondsLeft: 20, spoken: said(2) }) }];
    const totals = Object.fromEntries(standings(individual, turns).map((r) => [nameOf(individual, r.side), r.total]));
    expect(totals).toEqual({ Leo: 5, Maya: 2, Priya: 0 });
  });

  it('names every side tied at the top', () => {
    expect(winners([{ side: 'a', total: 9, last: 0, predictions: 0 }, { side: 'b', total: 9, last: 0, predictions: 0 }, { side: 'c', total: 2, last: 0, predictions: 0 }])).toEqual(['a', 'b']);
  });
});

describe('Fix this turn', () => {
  it('changes the outcome and the correct predictions, removing logged words from the end first', () => {
    const played = result({ secondsLeft: 42, spoken: said(4) });
    const fewer = fixTurn(played, { guessed: false, spoken: played.spoken, predictions: 2 });
    expect(fewer).toMatchObject({ guessed: false, spoken: said(2), extra: 0 });
    const more = fixTurn(played, { guessed: true, spoken: played.spoken, predictions: 6 });
    expect(turnPoints(more)).toMatchObject({ readerSide: 6, clueSide: 7 });
  });

  it('keeps the words that are left when one is removed from the list', () => {
    const played = result({ spoken: said(3) });
    const removed = [played.spoken[0]!, played.spoken[2]!];
    expect(fixTurn(played, { guessed: true, spoken: removed, predictions: 2 }).spoken).toEqual(removed);
  });
});
