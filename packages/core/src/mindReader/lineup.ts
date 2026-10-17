// Mind Reader's players and teams: who is playing, in what turn order, and on which team. Pure
// functions over plain data, so setup screens on every platform edit a lineup the same way and the
// game reads it as it was when the game started. Names come from the platform (typed, or a default
// filled from the copy catalog); colors are indexes into the design tokens' team colors.

import { gameConfig, type GameConfig } from '../config';
import type { Random } from '../types';

export const PLAY_STYLES = ['individual', 'teams'] as const;
export type PlayStyle = (typeof PLAY_STYLES)[number];

export type Player = {
  id: string;
  name: string;
  // False for a player added by the count stepper with a default name ("Player 4"). A typed name
  // fills the first of these before a new player is added.
  named: boolean;
};

export type Team = {
  id: string;
  name: string;
  // Index into the team colors (design tokens).
  color: number;
  // Player ids, in the order they give clues.
  members: readonly string[];
};

export type Lineup = {
  style: PlayStyle;
  // Turn order in Individual; the order players fill teams in Teams.
  players: readonly Player[];
  // Kept in step with players while the style is Teams.
  teams: readonly Team[];
  // The next id to hand out, so ids never repeat within a lineup.
  nextId: number;
};

// A team's starting name and color, in the order teams are added. The platform passes at least
// config.mindReader.maxTeams of them.
export type TeamPreset = { name: string; color: number };

// A default name for the nth player (1-based), filled from the copy catalog.
export type DefaultName = (n: number) => string;

export function emptyLineup(): Lineup {
  return { style: 'individual', players: [], teams: [], nextId: 1 };
}

// --- Rules -----------------------------------------------------------------------------------

// The fewest players a team game needs: every team at its minimum.
export function minTeamPlayers(config: GameConfig = gameConfig): number {
  const { minPerTeam, minTeams } = config.mindReader;
  return minPerTeam * minTeams;
}

export function canUseTeams(playerCount: number, config: GameConfig = gameConfig): boolean {
  return playerCount >= minTeamPlayers(config);
}

// The most teams these players can make with every team at its minimum, never past maxTeams.
export function maxTeamsFor(playerCount: number, config: GameConfig = gameConfig): number {
  const { minPerTeam, maxTeams } = config.mindReader;
  return Math.min(maxTeams, Math.floor(playerCount / minPerTeam));
}

// What stops a lineup from starting, calmest first to fix. Null when it can play.
export type LineupIssue =
  | { kind: 'tooFewPlayers'; missing: number }
  | { kind: 'teamsNeedPlayers'; missing: number }
  | { kind: 'tooManyTeams'; max: number }
  | { kind: 'smallTeam'; teamId: string; size: number; min: number };

export function lineupIssue(lineup: Lineup, config: GameConfig = gameConfig): LineupIssue | null {
  const n = lineup.players.length;
  const { minPlayers, minPerTeam } = config.mindReader;
  if (n < minPlayers) return { kind: 'tooFewPlayers', missing: minPlayers - n };
  if (lineup.style === 'individual') return null;
  if (!canUseTeams(n, config)) return { kind: 'teamsNeedPlayers', missing: minTeamPlayers(config) - n };
  const max = maxTeamsFor(n, config);
  if (lineup.teams.length > max) return { kind: 'tooManyTeams', max };
  const small = lineup.teams.find((t) => t.members.length < minPerTeam);
  if (small) return { kind: 'smallTeam', teamId: small.id, size: small.members.length, min: minPerTeam };
  return null;
}

export function canPlay(lineup: Lineup, config: GameConfig = gameConfig): boolean {
  return lineupIssue(lineup, config) === null;
}

// --- Reading -----------------------------------------------------------------------------------

export function playerName(lineup: Lineup, id: string): string {
  return lineup.players.find((p) => p.id === id)?.name ?? '';
}

export function teamOf(lineup: Lineup, playerId: string): Team | undefined {
  return lineup.teams.find((t) => t.members.includes(playerId));
}

// --- Players -----------------------------------------------------------------------------------

function newPlayer(lineup: Lineup, name: string, named: boolean): [Player, Lineup] {
  const player = { id: `p${lineup.nextId}`, name, named };
  return [player, { ...lineup, nextId: lineup.nextId + 1 }];
}

// The smallest team, the first of equals: where a new player goes.
function smallestTeam(teams: readonly Team[]): Team | undefined {
  return teams.reduce<Team | undefined>((min, t) => (!min || t.members.length < min.members.length ? t : min), undefined);
}

function withPlayer(lineup: Lineup, player: Player): Lineup {
  const players = [...lineup.players, player];
  if (lineup.style !== 'teams') return { ...lineup, players };
  const target = smallestTeam(lineup.teams);
  const teams = lineup.teams.map((t) => (t === target ? { ...t, members: [...t.members, player.id] } : t));
  return { ...lineup, players, teams };
}

// Adds a typed name: it fills the first default-named player, or joins as a new player (on the
// smallest team in Teams). Blank names are ignored.
export function addPlayer(lineup: Lineup, name: string, config: GameConfig = gameConfig): Lineup {
  const trimmed = name.trim();
  if (!trimmed) return lineup;
  const unnamed = lineup.players.find((p) => !p.named);
  if (unnamed) return { ...lineup, players: lineup.players.map((p) => (p === unnamed ? { ...p, name: trimmed, named: true } : p)) };
  if (lineup.players.length >= config.mindReader.maxPlayers) return lineup;
  const [player, next] = newPlayer(lineup, trimmed, true);
  return withPlayer(next, player);
}

// Sets how many players there are: new players get default names; fewer removes from the end,
// default-named players first.
export function setPlayerCount(lineup: Lineup, count: number, defaultName: DefaultName, config: GameConfig = gameConfig): Lineup {
  const target = Math.max(0, Math.min(config.mindReader.maxPlayers, Math.floor(count)));
  let next = lineup;
  while (next.players.length < target) {
    const [player, after] = newPlayer(next, defaultName(next.players.length + 1), false);
    next = withPlayer(after, player);
  }
  while (next.players.length > target) {
    const players = next.players;
    const lastUnnamed = [...players].reverse().find((p) => !p.named);
    next = removePlayer(next, (lastUnnamed ?? players[players.length - 1])!.id);
  }
  return next;
}

export function renamePlayer(lineup: Lineup, id: string, name: string): Lineup {
  const trimmed = name.trim();
  if (!trimmed) return lineup;
  return { ...lineup, players: lineup.players.map((p) => (p.id === id ? { ...p, name: trimmed, named: true } : p)) };
}

export function removePlayer(lineup: Lineup, id: string): Lineup {
  if (!lineup.players.some((p) => p.id === id)) return lineup;
  return {
    ...lineup,
    players: lineup.players.filter((p) => p.id !== id),
    teams: lineup.teams.map((t) => (t.members.includes(id) ? { ...t, members: t.members.filter((m) => m !== id) } : t)),
  };
}

function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

// A new turn order (Individual).
export function shuffleOrder(lineup: Lineup, random: Random): Lineup {
  return { ...lineup, players: shuffled(lineup.players, random) };
}

// --- Teams ---------------------------------------------------------------------------------------

// Player ids split into `count` runs as even as possible, the first teams taking any extra.
function chunk(ids: readonly string[], count: number): string[][] {
  const base = Math.floor(ids.length / count);
  const extra = ids.length % count;
  const out: string[][] = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    out.push(ids.slice(at, at + size));
    at += size;
  }
  return out;
}

// Players in team order (each team's members, then anyone on no team), so rebuilding keeps
// teammates together where it can.
function teamOrder(lineup: Lineup): string[] {
  const placed = lineup.teams.flatMap((t) => t.members).filter((id) => lineup.players.some((p) => p.id === id));
  const rest = lineup.players.map((p) => p.id).filter((id) => !placed.includes(id));
  return [...placed, ...rest];
}

function buildTeams(lineup: Lineup, count: number, presets: readonly TeamPreset[], ids: readonly string[]): Team[] {
  const groups = chunk(ids, count);
  return groups.map((members, i) => {
    const kept = lineup.teams[i];
    const preset = presets[i] ?? { name: '', color: i };
    return kept ? { ...kept, members } : { id: `t${i + 1}`, name: preset.name, color: preset.color, members };
  });
}

// Whether every player is on exactly one team.
function teamsMatchPlayers(lineup: Lineup): boolean {
  const members = lineup.teams.flatMap((t) => t.members);
  return members.length === lineup.players.length && lineup.players.every((p) => members.includes(p.id));
}

// Individual or Teams. Teams keeps the teams from before when they still hold every player, and
// otherwise splits the players into as many teams as before (at least config.minTeams).
export function setStyle(lineup: Lineup, style: PlayStyle, presets: readonly TeamPreset[], config: GameConfig = gameConfig): Lineup {
  if (style === lineup.style) return lineup;
  if (style === 'individual') return { ...lineup, style };
  if (lineup.teams.length > 0 && teamsMatchPlayers(lineup)) return { ...lineup, style };
  const count = Math.max(config.mindReader.minTeams, lineup.teams.length);
  const next = { ...lineup, style };
  return { ...next, teams: buildTeams(next, count, presets, teamOrder(next)) };
}

// More or fewer teams, from config.minTeams to config.maxTeams; players are spread evenly again.
// A count these players can't fill is allowed: lineupIssue says so and setup waits.
export function setTeamCount(lineup: Lineup, count: number, presets: readonly TeamPreset[], config: GameConfig = gameConfig): Lineup {
  const { minTeams, maxTeams } = config.mindReader;
  const target = Math.max(minTeams, Math.min(maxTeams, Math.floor(count)));
  if (target === lineup.teams.length) return lineup;
  return { ...lineup, teams: buildTeams(lineup, target, presets, teamOrder(lineup)) };
}

// New teammates: the same teams, players dealt into them at random, evenly.
export function shuffleTeams(lineup: Lineup, random: Random): Lineup {
  if (lineup.teams.length === 0) return lineup;
  const ids = shuffled(lineup.players.map((p) => p.id), random);
  return { ...lineup, teams: buildTeams(lineup, lineup.teams.length, [], ids) };
}

// Moves a player to another team (teams may be lopsided; lineupIssue checks the minimum).
export function movePlayer(lineup: Lineup, playerId: string, teamId: string): Lineup {
  const from = teamOf(lineup, playerId);
  if (!lineup.teams.some((t) => t.id === teamId) || from?.id === teamId) return lineup;
  return {
    ...lineup,
    teams: lineup.teams.map((t) =>
      t.id === teamId ? { ...t, members: [...t.members, playerId] } : t.id === from?.id ? { ...t, members: t.members.filter((m) => m !== playerId) } : t,
    ),
  };
}

export function renameTeam(lineup: Lineup, teamId: string, name: string): Lineup {
  const trimmed = name.trim();
  if (!trimmed) return lineup;
  return { ...lineup, teams: lineup.teams.map((t) => (t.id === teamId ? { ...t, name: trimmed } : t)) };
}

export function setTeamColor(lineup: Lineup, teamId: string, color: number): Lineup {
  return { ...lineup, teams: lineup.teams.map((t) => (t.id === teamId ? { ...t, color } : t)) };
}
