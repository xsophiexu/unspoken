// A Custom Mind Reader game: who plays which role each turn, how many turns make a round, how a
// turn scores and the standings after any number of turns. Everything is worked out from the
// lineup and the turns played, so fixing a turn changes every total that depends on it.

import { gameConfig, type GameConfig } from '../config';
import type { Lineup } from './lineup';

export type MindReaderSetup = { lineup: Lineup; rounds: number };

export type TurnRoles = {
  // 0-based turn and 1-based round.
  turn: number;
  round: number;
  // The team predicting (Teams), or null in Individual.
  readerTeamId: string | null;
  mindReaders: readonly string[];
  clueGiver: string;
  // The team giving clues and guessing (Teams), or null in Individual.
  clueTeamId: string | null;
  guessers: readonly string[];
  // Who scores what: a team id in Teams, a player id in Individual.
  readerSide: string;
  clueSide: string;
};

// Every team (or player) is the Mind Reader once a round.
export function turnsPerRound(lineup: Lineup): number {
  return lineup.style === 'teams' ? lineup.teams.length : lineup.players.length;
}

export function totalTurns(setup: MindReaderSetup): number {
  return turnsPerRound(setup.lineup) * setup.rounds;
}

export function roundOfTurn(lineup: Lineup, turn: number): number {
  const per = Math.max(1, turnsPerRound(lineup));
  return Math.floor(turn / per) + 1;
}

// Whether this turn is the last of its round.
export function endsRound(lineup: Lineup, turn: number): boolean {
  const per = Math.max(1, turnsPerRound(lineup));
  return (turn + 1) % per === 0;
}

// Rounds kept inside the config's range.
export function clampRounds(rounds: number, config: GameConfig = gameConfig): number {
  const { min, max } = config.mindReader.rounds;
  return Math.max(min, Math.min(max, Math.floor(rounds)));
}

// Individual: players take turns as Mind Reader in turn order; the next player gives clues and the
// rest guess, so each turn's Clue Giver is the next turn's Mind Reader.
// Teams: teams take turns predicting in order; the next team gives clues and guesses, its players
// taking turns as Clue Giver each time it is up.
export function turnRoles(lineup: Lineup, turn: number): TurnRoles {
  const round = roundOfTurn(lineup, turn);
  if (lineup.style === 'individual') {
    const ids = lineup.players.map((p) => p.id);
    const n = ids.length;
    const reader = ids[turn % n]!;
    const clue = ids[(turn + 1) % n]!;
    return {
      turn,
      round,
      readerTeamId: null,
      mindReaders: [reader],
      clueGiver: clue,
      clueTeamId: null,
      guessers: ids.filter((id) => id !== reader && id !== clue),
      readerSide: reader,
      clueSide: clue,
    };
  }
  const teams = lineup.teams;
  const n = teams.length;
  const readers = teams[turn % n]!;
  const clueIndex = (turn + 1) % n;
  const clueTeam = teams[clueIndex]!;
  // How many times this team has given clues before.
  let before = 0;
  for (let t = 0; t < turn; t++) if ((t + 1) % n === clueIndex) before++;
  const clueGiver = clueTeam.members[before % clueTeam.members.length]!;
  return {
    turn,
    round,
    readerTeamId: readers.id,
    mindReaders: readers.members,
    clueGiver,
    clueTeamId: clueTeam.id,
    guessers: clueTeam.members.filter((id) => id !== clueGiver),
    readerSide: readers.id,
    clueSide: clueTeam.id,
  };
}

// --- Scoring ---------------------------------------------------------------------------------

// A predicted word the Clue Giver said: which prediction, and when (seconds since clues began).
export type SpokenEntry = { prediction: number; at: number };

export type TurnResult = {
  guessed: boolean;
  // Seconds on the clock when the turn ended, or null with no time limit.
  secondsLeft: number | null;
  spoken: readonly SpokenEntry[];
  // Correct predictions added by hand on Fix this turn, on top of the logged ones.
  extra: number;
};

export function correctPredictions(result: TurnResult): number {
  return result.spoken.length + result.extra;
}

// A correct guess: a base, plus a bonus for every whole step of seconds left. With no time limit
// it is the base alone.
export function guessPoints(secondsLeft: number | null, config: GameConfig = gameConfig): number {
  const { guess, bonusEverySeconds, bonusPoints } = config.mindReader.scoring;
  if (secondsLeft === null) return guess;
  return guess + Math.floor(Math.max(0, secondsLeft) / bonusEverySeconds) * bonusPoints;
}

export type TurnPoints = {
  // To the guessing side (the Clue Giver's team, or the Clue Giver in Individual).
  guess: number;
  // To the Mind Readers: every time a prediction was said, repeats too.
  predictions: number;
  // To the Mind Readers when the word wasn't guessed.
  notGuessed: number;
  clueSide: number;
  readerSide: number;
};

export function turnPoints(result: TurnResult, config: GameConfig = gameConfig): TurnPoints {
  const { perPrediction, notGuessed } = config.mindReader.scoring;
  const guess = result.guessed ? guessPoints(result.secondsLeft, config) : 0;
  const predictions = correctPredictions(result) * perPrediction;
  const bonus = result.guessed ? 0 : notGuessed;
  return { guess, predictions, notGuessed: bonus, clueSide: guess, readerSide: predictions + bonus };
}

// Fix this turn: set the outcome and correct predictions by hand. Fewer predictions take logged
// entries off the end first; more are added as extras.
export function fixTurn(result: TurnResult, fix: { guessed: boolean; spoken: readonly SpokenEntry[]; predictions: number }): TurnResult {
  const target = Math.max(0, Math.floor(fix.predictions));
  const spoken = fix.spoken.slice(0, target);
  return { ...result, guessed: fix.guessed, spoken, extra: target - spoken.length };
}

// --- Standings ---------------------------------------------------------------------------------

export type PlayedTurn = { roles: TurnRoles; word: string; result: TurnResult };

export type Standing = {
  side: string;
  total: number;
  // Points from the latest turn.
  last: number;
  // Correct predictions over the game.
  predictions: number;
};

// Teams (or players) in the lineup's order.
export function sides(lineup: Lineup): string[] {
  return lineup.style === 'teams' ? lineup.teams.map((t) => t.id) : lineup.players.map((p) => p.id);
}

// Totals after the turns played, highest first; equal totals keep the lineup's order.
export function standings(lineup: Lineup, turns: readonly PlayedTurn[], config: GameConfig = gameConfig): Standing[] {
  const rows = new Map(sides(lineup).map((side) => [side, { side, total: 0, last: 0, predictions: 0 }]));
  turns.forEach((turn, i) => {
    const pts = turnPoints(turn.result, config);
    const latest = i === turns.length - 1;
    const reader = rows.get(turn.roles.readerSide);
    const clue = rows.get(turn.roles.clueSide);
    if (reader) {
      reader.total += pts.readerSide;
      reader.predictions += correctPredictions(turn.result);
      if (latest) reader.last += pts.readerSide;
    }
    if (clue) {
      clue.total += pts.clueSide;
      if (latest) clue.last += pts.clueSide;
    }
  });
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

// The sides with the top total: one winner, or several on a tie.
export function winners(rows: readonly Standing[]): string[] {
  const top = rows[0]?.total;
  return top === undefined ? [] : rows.filter((r) => r.total === top).map((r) => r.side);
}
