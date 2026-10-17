import { describe, expect, it } from 'vitest';

import {
  addPlayer,
  canPlay,
  canUseTeams,
  emptyLineup,
  lineupIssue,
  maxTeamsFor,
  movePlayer,
  removePlayer,
  renamePlayer,
  renameTeam,
  setPlayerCount,
  setStyle,
  setTeamColor,
  setTeamCount,
  shuffleOrder,
  shuffleTeams,
  teamOf,
  type Lineup,
  type TeamPreset,
} from '../src';
import { seededRandom } from '../src';

const presets: TeamPreset[] = ['Sharks', 'Owls', 'Foxes', 'Bears', 'Wolves', 'Otters'].map((name, color) => ({ name, color }));
const defaultName = (n: number) => `Player ${n}`;
const named = (...names: string[]): Lineup => names.reduce((l, n) => addPlayer(l, n), emptyLineup());
const names = (lineup: Lineup) => lineup.players.map((p) => p.name);
const teamNames = (lineup: Lineup) => lineup.teams.map((t) => t.members.map((id) => lineup.players.find((p) => p.id === id)!.name));
const teams = (lineup: Lineup, count = 2) => setTeamCount(setStyle(lineup, 'teams', presets), count, presets);
const six = () => named('Maya', 'Sam', 'Ava', 'Leo', 'Priya', 'Kai');

describe('Mind Reader players', () => {
  it('2 players can’t play; 3 can, in Individual', () => {
    expect(lineupIssue(named('Maya', 'Leo'))).toEqual({ kind: 'tooFewPlayers', missing: 1 });
    expect(canPlay(named('Maya', 'Leo', 'Priya'))).toBe(true);
  });

  it('3 players can’t play in teams; 4 can', () => {
    expect(canUseTeams(3)).toBe(false);
    expect(canUseTeams(4)).toBe(true);
    expect(lineupIssue({ ...named('Maya', 'Leo', 'Priya'), style: 'teams' })).toEqual({ kind: 'teamsNeedPlayers', missing: 1 });
    expect(canPlay(teams(named('Maya', 'Leo', 'Priya', 'Kai')))).toBe(true);
  });

  it('a player count without names fills default names; a typed name takes the first default slot', () => {
    const counted = setPlayerCount(emptyLineup(), 4, defaultName);
    expect(names(counted)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    expect(names(addPlayer(counted, ' Maya '))).toEqual(['Maya', 'Player 2', 'Player 3', 'Player 4']);
  });

  it('lowering the count removes default-named players before named ones', () => {
    const lineup = addPlayer(setPlayerCount(emptyLineup(), 3, defaultName), 'Maya');
    expect(names(setPlayerCount(lineup, 1, defaultName))).toEqual(['Maya']);
  });

  it('ignores blank names and keeps the name on a blank rename', () => {
    const lineup = named('Maya');
    expect(addPlayer(lineup, '   ')).toBe(lineup);
    expect(names(renamePlayer(lineup, lineup.players[0]!.id, ' '))).toEqual(['Maya']);
    expect(names(renamePlayer(lineup, lineup.players[0]!.id, 'Mia'))).toEqual(['Mia']);
  });

  it('shuffling the turn order keeps every player', () => {
    const shuffled = shuffleOrder(six(), seededRandom(3).random);
    expect([...names(shuffled)].sort()).toEqual([...names(six())].sort());
    expect(names(shuffled)).not.toEqual(names(six()));
  });
});

describe('Mind Reader teams', () => {
  it('splits players evenly into teams with their preset names', () => {
    const lineup = teams(six());
    expect(lineup.teams.map((t) => t.name)).toEqual(['Sharks', 'Owls']);
    expect(teamNames(lineup)).toEqual([
      ['Maya', 'Sam', 'Ava'],
      ['Leo', 'Priya', 'Kai'],
    ]);
  });

  it('derives the most teams from the player count, capped at the maximum', () => {
    expect(maxTeamsFor(6)).toBe(3);
    expect(maxTeamsFor(7)).toBe(3);
    expect(maxTeamsFor(20)).toBe(6);
  });

  it('too many teams for the players is reported with the most allowed', () => {
    expect(lineupIssue(teams(six(), 4))).toEqual({ kind: 'tooManyTeams', max: 3 });
    expect(lineupIssue(teams(named('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'), 4))).toBeNull();
  });

  it('allows lopsided teams while every team has its minimum', () => {
    const lineup = teams(named('Maya', 'Sam', 'Ava', 'Leo', 'Priya', 'Kai', 'Zoe'));
    const moved = movePlayer(lineup, lineup.players[0]!.id, lineup.teams[1]!.id);
    expect(moved.teams.map((t) => t.members.length)).toEqual([3, 4]);
    expect(canPlay(moved)).toBe(true);
  });

  it('a team under the minimum blocks the game until it is fixed', () => {
    let lineup = teams(six());
    const sharks = lineup.teams[0]!;
    for (const id of sharks.members.slice(0, 2)) lineup = movePlayer(lineup, id, lineup.teams[1]!.id);
    expect(lineupIssue(lineup)).toEqual({ kind: 'smallTeam', teamId: sharks.id, size: 1, min: 2 });
  });

  it('a new player joins the smallest team; a removed one leaves theirs', () => {
    const lineup = teams(named('Maya', 'Sam', 'Ava', 'Leo', 'Priya'));
    const added = addPlayer(lineup, 'Kai');
    expect(teamOf(added, added.players[5]!.id)?.name).toBe('Owls');
    const removed = removePlayer(added, added.players[0]!.id);
    expect(teamNames(removed)).toEqual([
      ['Sam', 'Ava'],
      ['Leo', 'Priya', 'Kai'],
    ]);
  });

  it('keeps team names and colors when the team count changes', () => {
    const lineup = setTeamColor(renameTeam(teams(six()), 't1', 'Comets'), 't1', 4);
    const three = setTeamCount(lineup, 3, presets);
    expect(three.teams.map((t) => [t.name, t.color])).toEqual([
      ['Comets', 4],
      ['Owls', 1],
      ['Foxes', 2],
    ]);
    expect(three.teams.map((t) => t.members.length)).toEqual([2, 2, 2]);
  });

  it('keeps the team count between the minimum and maximum', () => {
    expect(setTeamCount(teams(six()), 1, presets).teams).toHaveLength(2);
    expect(setTeamCount(teams(six()), 9, presets).teams).toHaveLength(6);
  });

  it('shuffling teammates keeps the teams and their sizes', () => {
    const lineup = teams(six());
    const shuffled = shuffleTeams(lineup, seededRandom(9).random);
    expect(shuffled.teams.map((t) => [t.name, t.members.length])).toEqual([
      ['Sharks', 3],
      ['Owls', 3],
    ]);
    expect(shuffled.teams.flatMap((t) => t.members).sort()).toEqual(lineup.players.map((p) => p.id).sort());
    expect(teamNames(shuffled)).not.toEqual(teamNames(lineup));
  });

  it('switching back to teams keeps the teams when nobody changed, and rebuilds them when players did', () => {
    const moved = (() => {
      const lineup = teams(six());
      return movePlayer(lineup, lineup.players[0]!.id, 't2');
    })();
    const roundTrip = setStyle(setStyle(moved, 'individual', presets), 'teams', presets);
    expect(roundTrip.teams).toEqual(moved.teams);
    const edited = setStyle(addPlayer(setStyle(moved, 'individual', presets), 'Zoe'), 'teams', presets);
    expect(edited.teams.flatMap((t) => t.members)).toHaveLength(7);
  });
});
