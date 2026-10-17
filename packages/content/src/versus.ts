import {
  cardPoints,
  endsVersusRound,
  format,
  outcomeCounts,
  playerName,
  plural,
  turnTotal,
  versusCurrentRoles,
  versusLastTurn,
  versusNextRoles,
  versusNextTimeRoles,
  versusStandingsNow,
  versusWinners,
  isVersusOver,
  type CardOutcome,
  type Lineup,
  type VersusRoles,
  type VersusRoundState,
} from '@unspoken/core';

import { en, listNames, possessive } from './en';
import type { DetailsSection, MindReaderSide, RoleCard, ScoreRow } from './mindReader';

// What each Versus screen says, from the round state and the copy catalog, so the app and the web
// site show the same words. Team colors are indexes into the design tokens' team colors.

const v = en.versus;

const lineupOf = (state: VersusRoundState): Lineup => state.setup.lineup;
const namesOf = (lineup: Lineup, ids: readonly string[]) => ids.map((id) => playerName(lineup, id));

function teamSide(lineup: Lineup, id: string | null): MindReaderSide | null {
  const t = lineup.teams.find((x) => x.id === id);
  return t ? { name: t.name, color: t.color } : null;
}

// The team (Teams) or player (Individual) a score belongs to.
function sideOf(lineup: Lineup, side: string): MindReaderSide {
  return teamSide(lineup, side) ?? { name: playerName(lineup, side), color: null };
}

// The side giving clues this turn: the team, or the Clue Giver.
function givingSide(lineup: Lineup, roles: VersusRoles): MindReaderSide {
  return lineup.style === 'teams' ? (teamSide(lineup, roles.teamId) ?? { name: '', color: null }) : { name: playerName(lineup, roles.clueGiver), color: null };
}

// "+3", "0", "−1".
export function signedPoints(n: number): string {
  if (n > 0) return format(v.plus, { n });
  if (n < 0) return format(v.minus, { n: -n });
  return '0';
}

// The other teams, as one name or several ("Sharks", "Sharks and Foxes").
function watchingTeams(lineup: Lineup, roles: VersusRoles): string {
  return listNames(lineup.teams.filter((t) => t.id !== roles.teamId).map((t) => t.name));
}

// --- Header ----------------------------------------------------------------------------------

export function versusTitle(state: VersusRoundState): string {
  return format(v.round, { round: versusCurrentRoles(state).round, rounds: state.setup.rounds });
}

// Teams: "Owls are up · Leo gives clues" and who guesses. Individual: the Clue Giver and who
// guesses ("Guesser" when there is one).
export function versusRoleCards(state: VersusRoundState): RoleCard[] {
  const lineup = lineupOf(state);
  const roles = versusCurrentRoles(state);
  const clue = playerName(lineup, roles.clueGiver);
  const guessers = namesOf(lineup, roles.guessers).join(', ');
  if (lineup.style === 'teams') {
    return [
      { label: format(v.cards.teamUp, { team: teamSide(lineup, roles.teamId)?.name ?? '' }), value: format(v.cards.givesClues, { name: clue }) },
      { label: v.cards.guessing, value: guessers },
    ];
  }
  return [
    { label: v.cards.clueGiver, value: clue },
    { label: roles.guessers.length === 1 ? v.cards.guesser : v.cards.guessing, value: guessers },
  ];
}

// "Who's playing this turn".
export function versusDetails(state: VersusRoundState): { sections: DetailsSection[]; footer: string } {
  const lineup = lineupOf(state);
  const roles = versusCurrentRoles(state);
  const d = v.detailsSheet;
  const team = teamSide(lineup, roles.teamId);
  const others = lineup.teams.filter((t) => t.id !== roles.teamId);
  const sections: DetailsSection[] = [
    { label: d.clueGiver, team, names: namesOf(lineup, [roles.clueGiver]) },
    { label: d.guessing, team, names: namesOf(lineup, roles.guessers) },
  ];
  if (roles.watchers.length > 0) {
    const one = others.length === 1 ? { name: others[0]!.name, color: others[0]!.color } : null;
    sections.push({ label: d.watching, team: one, names: namesOf(lineup, roles.watchers) });
  }
  return { sections, footer: nextLine(lineup, versusNextRoles(state)) };
}

function nextLine(lineup: Lineup, next: VersusRoles | null): string {
  const d = v.detailsSheet;
  if (!next) return d.last;
  const name = playerName(lineup, next.clueGiver);
  return lineup.style === 'teams' ? format(d.nextTeams, { team: teamSide(lineup, next.teamId)?.name ?? '', name }) : format(d.nextIndividual, { name });
}

// --- Pass the phone ----------------------------------------------------------------------------

export type PassView = {
  kicker: string;
  title: string;
  color: number | null;
  sub: string;
  rows: { label: string; value: string }[];
  note: string;
  nextTime: string | null;
  button: string;
};

export function passView(state: VersusRoundState): PassView {
  const p = v.pass;
  const lineup = lineupOf(state);
  const roles = versusCurrentRoles(state);
  const clue = playerName(lineup, roles.clueGiver);
  const side = givingSide(lineup, roles);
  const guessers = namesOf(lineup, roles.guessers);
  const teams = lineup.style === 'teams';
  const rows = [
    { label: p.clueGiver, value: clue },
    { label: guessers.length === 1 ? p.guesser : p.guessing, value: listNames(guessers) },
    ...(teams ? [{ label: p.watching, value: watchingTeams(lineup, roles) }] : []),
  ];
  const later = teams ? versusNextTimeRoles(state) : null;
  return {
    kicker: format(p.kicker, { round: roles.round, rounds: state.setup.rounds }),
    title: format(p.title, { whose: possessive(side.name) }),
    color: side.color,
    sub: teams ? format(p.sub, { name: clue }) : guessers.length === 1 ? format(p.subOne, { name: guessers[0]! }) : p.subOthers,
    rows,
    note: format(p.note, { name: clue }),
    nextTime: later ? format(p.nextTime, { name: playerName(lineup, later.clueGiver), team: side.name }) : null,
    button: format(p.ready, { name: clue }),
  };
}

// Individual with 3 or more players: who can be credited with a correct card.
export function guesserButtons(state: VersusRoundState): { id: string; name: string; label: string }[] {
  const lineup = lineupOf(state);
  return versusCurrentRoles(state).guessers.map((id) => {
    const name = playerName(lineup, id);
    return { id, name, label: format(en.a11y.gotIt, { name }) };
  });
}

// --- Turn recap --------------------------------------------------------------------------------

export type RecapRow = { index: number; word: string; who: string | null; outcome: CardOutcome; label: string; points: string; a11y: string };
export type RecapView = {
  kicker: string;
  title: string;
  scored: string;
  total: string;
  counts: { outcome: CardOutcome; label: string }[];
  hint: string;
  rows: RecapRow[];
  button: string;
};

export function recapView(state: VersusRoundState): RecapView | null {
  const turn = versusLastTurn(state);
  if (!turn) return null;
  const r = v.recap;
  const lineup = lineupOf(state);
  const roles = turn.roles;
  const side = givingSide(lineup, roles);
  const counts = outcomeCounts(turn.cards);
  const individual = lineup.style === 'individual';
  const many = roles.guessers.length > 1;
  const next = versusNextRoles(state);
  const ending = isVersusOver(state) ? r.seeResults : endsVersusRound(lineup, roles.turn) ? r.seeScores : null;
  const nextSide = next ? givingSide(lineup, next) : null;
  const params = { round: roles.round, rounds: state.setup.rounds };
  return {
    kicker: individual ? format(r.kickerIndividual, { ...params, name: side.name }) : format(r.kicker, { ...params, team: side.name }),
    title: r.title,
    scored: format(r.scored, { side: side.name }),
    total: signedPoints(turnTotal(lineup, turn, state.setup, state.config)),
    counts: (['correct', 'notGuessed', 'banned'] as const).map((outcome) => ({ outcome, label: plural(counts[outcome], r[outcome]) })),
    hint: r.hint,
    rows: turn.cards.map((card, index) => {
      const points = signedPoints(cardPoints(card.outcome, state.setup, state.config));
      const label = r.outcomes[card.outcome];
      const who = card.outcome === 'correct' && individual && many && card.guesser ? playerName(lineup, card.guesser) : card.outcome === 'notGuessed' && card.ended === 'timeUp' ? r.timeUp : null;
      return { index, word: card.word, who, outcome: card.outcome, label, points, a11y: format(r.rowLabel, { word: card.word, outcome: label, points }) };
    }),
    button: ending ?? format(r.next, { whose: possessive(nextSide?.name ?? '') }),
  };
}

// --- Scores and results ------------------------------------------------------------------------

function scoreRows(state: VersusRoundState, withLast: boolean): ScoreRow[] {
  const lineup = lineupOf(state);
  return versusStandingsNow(state).map((row, i) => ({
    ...sideOf(lineup, row.side),
    rank: i + 1,
    total: row.total,
    last: withLast ? signedPoints(row.last) : null,
  }));
}

export type VersusScoresView = { kicker: string; rows: ScoreRow[]; left: string; next: string; nextColor: number | null; hand: string; button: string };

export function versusScoresView(state: VersusRoundState): VersusScoresView | null {
  const turn = versusLastTurn(state);
  const next = versusNextRoles(state);
  if (!turn || !next) return null;
  const s = v.scores;
  const lineup = lineupOf(state);
  const clue = playerName(lineup, next.clueGiver);
  const side = givingSide(lineup, next);
  const guessers = namesOf(lineup, next.guessers);
  return {
    kicker: format(s.kicker, { round: turn.roles.round, rounds: state.setup.rounds }),
    rows: scoreRows(state, true),
    left: plural(state.setup.rounds - turn.roles.round, s.left),
    next:
      lineup.style === 'teams'
        ? format(s.nextTeams, { team: side.name, name: clue })
        : guessers.length === 1
          ? format(s.nextOne, { name: clue, guesser: guessers[0]! })
          : format(s.nextIndividual, { name: clue }),
    nextColor: side.color,
    hand: format(s.hand, { name: clue }),
    button: format(s.start, { whose: possessive(side.name) }),
  };
}

export type VersusResultsView = { kicker: string; title: string; sub: string; rows: ScoreRow[] };

export function versusResultsView(state: VersusRoundState): VersusResultsView {
  const r = v.results;
  const lineup = lineupOf(state);
  const standings = versusStandingsNow(state);
  const top = versusWinners(standings);
  const best = standings[0];
  const winner = top.length === 1 && top[0] ? sideOf(lineup, top[0]) : null;
  const teams = lineup.style === 'teams';
  const details = !best
    ? []
    : teams
      ? [plural(best.correct, r.correct), ...(best.banned > 0 ? [plural(best.banned, r.banned)] : [])]
      : [format(r.asClueGiver, { n: best.asClueGiver }), format(r.guessing, { n: best.guessing }), ...(best.penalty > 0 ? [plural(best.penalty, r.penalty)] : [])];
  return {
    kicker: plural(state.setup.rounds, r.kicker),
    title: winner ? format(teams ? r.winTeam : r.winPlayer, { team: winner.name, name: winner.name }) : r.tie,
    sub: best ? format(r.sub, { points: plural(best.total, r.points), details: details.join(', ') }) : '',
    rows: scoreRows(state, false),
  };
}
