// A Versus game: teams (or players) take turns giving clues. Each turn, one Clue Giver describes
// card after card until the clock runs out, and the rest of their team (or everyone else in
// Individual) guesses. Every card ends Correct, Not guessed or Banned word. Pure functions over
// plain data: who plays each turn, how a turn scores and the standings after any number of turns,
// so changing a card in the recap changes every total that depends on it.

import { gameConfig, type GameConfig } from '../config';
import { canPlay, lineupIssue, type Lineup, type LineupIssue } from '../mindReader/lineup';
import type { GameSettings } from '../types';

export type VersusSetup = {
  lineup: Lineup;
  rounds: number;
  // Each turn's time limit in seconds; noTimeLimit plays without one (the Clue Giver ends the turn).
  turnSeconds: number;
  noTimeLimit: boolean;
  // Skips allowed each turn.
  skips: number;
  // The banned word penalty: off, a banned word scores 0; on, it costs penaltyPoints.
  penalty: boolean;
  penaltyPoints: number;
};

export function defaultVersusSetup(lineup: Lineup, config: GameConfig = gameConfig): VersusSetup {
  const v = config.versus;
  return {
    lineup,
    rounds: v.rounds.default,
    turnSeconds: v.turnSeconds,
    noTimeLimit: false,
    skips: v.skips.default,
    penalty: v.penalty.on,
    penaltyPoints: v.penalty.points.default,
  };
}

// --- Players ---------------------------------------------------------------------------------

// The lineup functions (canUseTeams, lineupIssue, setTeamCount ...) read their limits from
// config.mindReader. This is the same config with Versus's limits in their place, to pass to them
// while setting up a Versus game.
export function versusLineupConfig(config: GameConfig = gameConfig): GameConfig {
  return { ...config, mindReader: { ...config.mindReader, ...config.versus.lineup } };
}

export function versusLineupIssue(lineup: Lineup, config: GameConfig = gameConfig): LineupIssue | null {
  return lineupIssue(lineup, versusLineupConfig(config));
}

export function canPlayVersus(lineup: Lineup, config: GameConfig = gameConfig): boolean {
  return canPlay(lineup, versusLineupConfig(config));
}

// Settings stepper values kept inside the config's ranges.
function clamp(n: number, range: { min: number; max: number }): number {
  return Math.max(range.min, Math.min(range.max, Math.floor(n)));
}

export function clampVersusSetup(setup: VersusSetup, config: GameConfig = gameConfig): VersusSetup {
  const v = config.versus;
  return {
    ...setup,
    rounds: clamp(setup.rounds, v.rounds),
    skips: clamp(setup.skips, v.skips),
    penaltyPoints: clamp(setup.penaltyPoints, v.penalty.points),
    turnSeconds: clamp(setup.turnSeconds, { min: config.minRoundSeconds, max: config.maxRoundSeconds }),
  };
}

// A Versus game needs a lineup set up in this app session; saved settings that name Versus open
// the default mode instead.
export function resumableSettings(settings: GameSettings, config: GameConfig = gameConfig): GameSettings {
  return config.modes.find((m) => m.id === settings.mode)?.play === 'versus' ? { ...settings, mode: config.defaults.mode } : settings;
}

// --- Turns -----------------------------------------------------------------------------------

export type VersusRoles = {
  // 0-based turn and 1-based round.
  turn: number;
  round: number;
  // The team giving clues and guessing (Teams), or null in Individual.
  teamId: string | null;
  clueGiver: string;
  guessers: readonly string[];
  // Everyone else, watching for banned words (the other teams; nobody in Individual).
  watchers: readonly string[];
};

// Every team (or player) gives clues once a round.
export function versusTurnsPerRound(lineup: Lineup): number {
  return Math.max(1, lineup.style === 'teams' ? lineup.teams.length : lineup.players.length);
}

export function versusTotalTurns(setup: Pick<VersusSetup, 'lineup' | 'rounds'>): number {
  return versusTurnsPerRound(setup.lineup) * setup.rounds;
}

export function versusRoundOf(lineup: Lineup, turn: number): number {
  return Math.floor(turn / versusTurnsPerRound(lineup)) + 1;
}

// Whether this turn is the last of its round.
export function endsVersusRound(lineup: Lineup, turn: number): boolean {
  return (turn + 1) % versusTurnsPerRound(lineup) === 0;
}

// Teams: teams take turns in order, and each team's players take turns as its Clue Giver.
// Individual: players give clues in turn order; everyone else guesses.
export function versusRoles(lineup: Lineup, turn: number): VersusRoles {
  const round = versusRoundOf(lineup, turn);
  if (lineup.style === 'individual') {
    const ids = lineup.players.map((p) => p.id);
    const clueGiver = ids[turn % ids.length]!;
    return { turn, round, teamId: null, clueGiver, guessers: ids.filter((id) => id !== clueGiver), watchers: [] };
  }
  const n = lineup.teams.length;
  const team = lineup.teams[turn % n]!;
  // How many times this team has given clues before.
  const before = Math.floor(turn / n);
  const clueGiver = team.members[before % team.members.length]!;
  return {
    turn,
    round,
    teamId: team.id,
    clueGiver,
    guessers: team.members.filter((id) => id !== clueGiver),
    watchers: lineup.teams.filter((t) => t.id !== team.id).flatMap((t) => t.members),
  };
}

// --- Cards and scoring -------------------------------------------------------------------------

export const CARD_OUTCOMES = ['correct', 'notGuessed', 'banned'] as const;
export type CardOutcome = (typeof CARD_OUTCOMES)[number];

export type PlayedCard = {
  word: string;
  outcome: CardOutcome;
  // Who guessed it (Individual). Kept when the card is changed in the recap, so changing it back
  // to Correct credits them again.
  guesser: string | null;
  // How a Not guessed card ended in play: skipped, or on screen when time ran out.
  ended: 'skipped' | 'timeUp' | null;
};

export type VersusTurn = { roles: VersusRoles; cards: readonly PlayedCard[] };

// The recap: a tap moves a card Correct → Not guessed → Banned word → Correct.
export function nextOutcome(outcome: CardOutcome): CardOutcome {
  const i = CARD_OUTCOMES.indexOf(outcome);
  return CARD_OUTCOMES[(i + 1) % CARD_OUTCOMES.length]!;
}

// A card in the turn changed in the recap. A card made Correct with nobody credited yet goes to
// the only guesser when there is just one (two players).
export function cycleCard(turn: VersusTurn, index: number): VersusTurn {
  const card = turn.cards[index];
  if (!card) return turn;
  const outcome = nextOutcome(card.outcome);
  const only = turn.roles.guessers.length === 1 ? turn.roles.guessers[0]! : null;
  const guesser = outcome === 'correct' ? (card.guesser ?? only) : card.guesser;
  return { ...turn, cards: turn.cards.map((c, i) => (i === index ? { ...c, outcome, guesser } : c)) };
}

export type OutcomeCounts = Record<CardOutcome, number>;

export function outcomeCounts(cards: readonly PlayedCard[]): OutcomeCounts {
  const counts: OutcomeCounts = { correct: 0, notGuessed: 0, banned: 0 };
  for (const c of cards) counts[c.outcome]++;
  return counts;
}

export type ScoringRules = Pick<VersusSetup, 'penalty' | 'penaltyPoints'>;

// What one card is worth to the side giving clues: +correctPoints, 0, or −penalty when it is on.
export function cardPoints(outcome: CardOutcome, rules: ScoringRules, config: GameConfig = gameConfig): number {
  if (outcome === 'correct') return config.versus.correctPoints;
  if (outcome === 'banned' && rules.penalty) return -rules.penaltyPoints;
  return 0;
}

// Who scores what for one turn, keyed by side (team id in Teams, player id in Individual).
// Teams: the team takes every card's points. Individual: the Clue Giver takes every card's points
// (Correct and the banned word penalty), and each guesser gets correctPoints for a card they got.
export function turnScores(lineup: Lineup, turn: VersusTurn, rules: ScoringRules, config: GameConfig = gameConfig): Map<string, number> {
  const out = new Map<string, number>();
  const add = (side: string, n: number) => out.set(side, (out.get(side) ?? 0) + n);
  const giver = lineup.style === 'teams' ? (turn.roles.teamId ?? '') : turn.roles.clueGiver;
  add(giver, 0);
  for (const card of turn.cards) {
    add(giver, cardPoints(card.outcome, rules, config));
    if (lineup.style === 'individual' && card.outcome === 'correct' && card.guesser) add(card.guesser, config.versus.correctPoints);
  }
  return out;
}

// The points the side giving clues made this turn (the recap's "+3").
export function turnTotal(lineup: Lineup, turn: VersusTurn, rules: ScoringRules, config: GameConfig = gameConfig): number {
  const side = lineup.style === 'teams' ? (turn.roles.teamId ?? '') : turn.roles.clueGiver;
  return turnScores(lineup, turn, rules, config).get(side) ?? 0;
}

// --- Standings ---------------------------------------------------------------------------------

export type VersusStanding = {
  side: string;
  total: number;
  // Points from the latest round played.
  last: number;
  // Cards guessed and banned words said while this side gave clues.
  correct: number;
  banned: number;
  // Individual: points as Clue Giver, points guessing, and points lost to banned words.
  asClueGiver: number;
  guessing: number;
  penalty: number;
};

function sidesOf(lineup: Lineup): string[] {
  return lineup.style === 'teams' ? lineup.teams.map((t) => t.id) : lineup.players.map((p) => p.id);
}

// Totals after the turns played, highest first; equal totals keep the lineup's order. `last`
// counts the turns of the latest round played.
export function versusStandings(setup: VersusSetup, turns: readonly VersusTurn[], config: GameConfig = gameConfig): VersusStanding[] {
  const { lineup } = setup;
  const rows = new Map(sidesOf(lineup).map((side) => [side, { side, total: 0, last: 0, correct: 0, banned: 0, asClueGiver: 0, guessing: 0, penalty: 0 }]));
  const latestRound = turns.length > 0 ? turns[turns.length - 1]!.roles.round : 0;
  for (const turn of turns) {
    const giver = lineup.style === 'teams' ? (turn.roles.teamId ?? '') : turn.roles.clueGiver;
    const counts = outcomeCounts(turn.cards);
    const giverRow = rows.get(giver);
    if (giverRow) {
      giverRow.correct += counts.correct;
      giverRow.banned += counts.banned;
      giverRow.asClueGiver += counts.correct * config.versus.correctPoints;
      giverRow.penalty += counts.banned * -cardPoints('banned', setup, config);
    }
    for (const [side, points] of turnScores(lineup, turn, setup, config)) {
      const row = rows.get(side);
      if (!row) continue;
      row.total += points;
      if (turn.roles.round === latestRound) row.last += points;
      if (side !== giver) row.guessing += points;
    }
  }
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

// The sides with the top total: one winner, or several on a tie.
export function versusWinners(rows: readonly VersusStanding[]): string[] {
  const top = rows[0]?.total;
  return top === undefined ? [] : rows.filter((r) => r.total === top).map((r) => r.side);
}
