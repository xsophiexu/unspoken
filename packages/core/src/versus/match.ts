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
  // Individual with 3 or more players: the player who got a card scores a bonus (and is picked
  // with "Tap who got it"). Off, every guesser scores the same and Correct needs no pick.
  bonus: boolean;
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
    bonus: v.individual.bonus.on,
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

export type ScoringRules = Pick<VersusSetup, 'penalty' | 'penaltyPoints' | 'bonus'>;

// Whether Game settings offers the "Bonus for who guesses it" switch: Individual with enough
// players for several guessers.
export function offersGuesserBonus(lineup: Lineup, config: GameConfig = gameConfig): boolean {
  return lineup.style === 'individual' && lineup.players.length >= config.versus.individual.bonus.minPlayers;
}

// Whether the player who got a card scores the bonus (and Correct asks who got it).
export function hasGuesserBonus(lineup: Lineup, rules: Pick<ScoringRules, 'bonus'>, config: GameConfig = gameConfig): boolean {
  return rules.bonus && offersGuesserBonus(lineup, config);
}

// What one card is worth to the side giving clues (the team, or the Clue Giver): its correct
// points, 0, or −penalty for a banned word when the penalty is on.
export function cardPoints(lineup: Lineup, outcome: CardOutcome, rules: ScoringRules, config: GameConfig = gameConfig): number {
  if (outcome === 'correct') return lineup.style === 'teams' ? config.versus.correctPoints : config.versus.individual.clueGiverPoints;
  if (outcome === 'banned' && rules.penalty) return -rules.penaltyPoints;
  return 0;
}

// One side's points from a turn, split the way the results explain them.
export type VersusTurnPoints = { clueGiver: number; guessing: number; bonus: number; penalty: number };

const sideGiving = (lineup: Lineup, turn: VersusTurn) => (lineup.style === 'teams' ? (turn.roles.teamId ?? '') : turn.roles.clueGiver);

// Who scores what for one turn, keyed by side (team id in Teams, player id in Individual).
// Teams: the team takes every card's points. Individual: a correct card gives the Clue Giver and
// every guesser their points, plus the bonus to whoever got it when the bonus is on; a banned word
// with the penalty on costs only the Clue Giver.
export function turnBreakdown(lineup: Lineup, turn: VersusTurn, rules: ScoringRules, config: GameConfig = gameConfig): Map<string, VersusTurnPoints> {
  const out = new Map<string, VersusTurnPoints>();
  const row = (side: string) => {
    let r = out.get(side);
    if (!r) out.set(side, (r = { clueGiver: 0, guessing: 0, bonus: 0, penalty: 0 }));
    return r;
  };
  const giver = row(sideGiving(lineup, turn));
  const individual = lineup.style === 'individual';
  const bonus = hasGuesserBonus(lineup, rules, config);
  const { guesserPoints, bonus: extra } = config.versus.individual;
  for (const card of turn.cards) {
    const points = cardPoints(lineup, card.outcome, rules, config);
    if (card.outcome === 'banned') giver.penalty -= points;
    if (card.outcome !== 'correct') continue;
    giver.clueGiver += points;
    if (!individual) continue;
    for (const g of turn.roles.guessers) row(g).guessing += guesserPoints;
    if (bonus && card.guesser && turn.roles.guessers.includes(card.guesser)) row(card.guesser).bonus += extra.points;
  }
  return out;
}

const totalOf = (p: VersusTurnPoints) => p.clueGiver + p.guessing + p.bonus - p.penalty;

export function turnScores(lineup: Lineup, turn: VersusTurn, rules: ScoringRules, config: GameConfig = gameConfig): Map<string, number> {
  return new Map([...turnBreakdown(lineup, turn, rules, config)].map(([side, p]) => [side, totalOf(p)]));
}

// The points the side giving clues made this turn (the recap's "+3").
export function turnTotal(lineup: Lineup, turn: VersusTurn, rules: ScoringRules, config: GameConfig = gameConfig): number {
  return turnScores(lineup, turn, rules, config).get(sideGiving(lineup, turn)) ?? 0;
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
  // Points as Clue Giver, guessing, from the bonus and lost to banned words; they add up to total.
  asClueGiver: number;
  guessing: number;
  bonus: number;
  penalty: number;
};

function sidesOf(lineup: Lineup): string[] {
  return lineup.style === 'teams' ? lineup.teams.map((t) => t.id) : lineup.players.map((p) => p.id);
}

// Totals after the turns played, highest first; equal totals keep the lineup's order. `last`
// counts the turns of the latest round played.
export function versusStandings(setup: VersusSetup, turns: readonly VersusTurn[], config: GameConfig = gameConfig): VersusStanding[] {
  const { lineup } = setup;
  const rows = new Map(sidesOf(lineup).map((side) => [side, { side, total: 0, last: 0, correct: 0, banned: 0, asClueGiver: 0, guessing: 0, bonus: 0, penalty: 0 }]));
  const latestRound = turns.length > 0 ? turns[turns.length - 1]!.roles.round : 0;
  for (const turn of turns) {
    const counts = outcomeCounts(turn.cards);
    const giverRow = rows.get(sideGiving(lineup, turn));
    if (giverRow) {
      giverRow.correct += counts.correct;
      giverRow.banned += counts.banned;
    }
    for (const [side, points] of turnBreakdown(lineup, turn, setup, config)) {
      const row = rows.get(side);
      if (!row) continue;
      const total = totalOf(points);
      row.total += total;
      if (turn.roles.round === latestRound) row.last += total;
      row.asClueGiver += points.clueGiver;
      row.guessing += points.guessing;
      row.bonus += points.bonus;
      row.penalty += points.penalty;
    }
  }
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

// The sides with the top total: one winner, or several on a tie.
export function versusWinners(rows: readonly VersusStanding[]): string[] {
  const top = rows[0]?.total;
  return top === undefined ? [] : rows.filter((r) => r.total === top).map((r) => r.side);
}
