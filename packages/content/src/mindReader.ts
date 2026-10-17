import {
  DIFFICULTY_IDS,
  correctPredictions,
  difficultyLabel,
  hasEasierDifficulty,
  currentRoles,
  endsRound,
  format,
  formatClock,
  guessPoints,
  lastTurn,
  matchStandings,
  mindReaderClock,
  nextRoles,
  playerName,
  plural,
  predictionsNeeded,
  spokenClock,
  turnPoints,
  winners,
  type Difficulty,
  type Lineup,
  type MindReaderRoundState,
  type TurnResult,
  type TurnRoles,
} from '@unspoken/core';

import { en, listNames, possessive } from './en';

// What each Mind Reader screen says, worked out once from the round state and the copy catalog so
// the app and the web site show the same words. Team colors are indexes into the design tokens.

const m = en.mindReader;

export type MindReaderSide = { name: string; color: number | null };
export type RoleCard = { label: string; value: string };
export type DetailsSection = { label: string; team: MindReaderSide | null; names: string[] };

function lineupOf(state: MindReaderRoundState): Lineup | null {
  return state.match?.setup.lineup ?? null;
}

const namesOf = (lineup: Lineup, ids: readonly string[]) => ids.map((id) => playerName(lineup, id));

function team(lineup: Lineup, id: string | null): MindReaderSide | null {
  const t = lineup.teams.find((x) => x.id === id);
  return t ? { name: t.name, color: t.color } : null;
}

// A team or player who scores: the team in Teams, the player in Individual.
export function sideOf(state: MindReaderRoundState, side: string): MindReaderSide {
  const lineup = lineupOf(state);
  if (!lineup) return { name: '', color: null };
  return team(lineup, side) ?? { name: playerName(lineup, side), color: null };
}

const isTeams = (state: MindReaderRoundState) => lineupOf(state)?.style === 'teams';

// --- Header --------------------------------------------------------------------------------------

// "Round 2 of 5" in a Custom game; "Quick Play" otherwise.
export function turnTitle(state: MindReaderRoundState): string {
  const roles = currentRoles(state);
  return roles && state.match ? format(m.round, { round: roles.round, rounds: state.match.setup.rounds }) : m.quick.title;
}

// The two role cards under the round: who predicts, and who gives clues.
export function roleCards(state: MindReaderRoundState): RoleCard[] {
  const lineup = lineupOf(state);
  const roles = currentRoles(state);
  if (!lineup || !roles) return [];
  const clue = playerName(lineup, roles.clueGiver);
  if (lineup.style === 'teams') {
    return [
      { label: m.cards.readers, value: team(lineup, roles.readerTeamId)?.name ?? '' },
      { label: format(m.cards.teamUp, { team: team(lineup, roles.clueTeamId)?.name ?? '' }), value: format(m.cards.givesClues, { name: clue }) },
    ];
  }
  return [
    { label: m.cards.reader, value: playerName(lineup, roles.mindReaders[0] ?? '') },
    { label: m.cards.clueGiver, value: clue },
  ];
}

// "Who's playing this turn": a section per role, and the next turn.
export function detailsSheet(state: MindReaderRoundState): { sections: DetailsSection[]; footer: string } | null {
  const lineup = lineupOf(state);
  const roles = currentRoles(state);
  if (!lineup || !roles) return null;
  const d = m.detailsSheet;
  const teams = lineup.style === 'teams';
  const sections: DetailsSection[] = [
    { label: teams ? d.readers : d.reader, team: team(lineup, roles.readerTeamId), names: namesOf(lineup, roles.mindReaders) },
    { label: d.clueGiver, team: team(lineup, roles.clueTeamId), names: namesOf(lineup, [roles.clueGiver]) },
    { label: d.guessers, team: team(lineup, roles.clueTeamId), names: namesOf(lineup, roles.guessers) },
  ];
  return { sections, footer: nextLine(lineup, nextRoles(state)) };
}

function nextLine(lineup: Lineup, next: TurnRoles | null): string {
  const d = m.detailsSheet;
  if (!next) return d.last;
  return lineup.style === 'teams'
    ? format(d.nextTeams, { team: team(lineup, next.readerTeamId)?.name ?? '' })
    : format(d.nextIndividual, { name: playerName(lineup, next.mindReaders[0] ?? '') });
}

// --- Roles ---------------------------------------------------------------------------------------

export type RolesCard = { label: string; title: string; color: number | null; detail: string };
export type RolesView = { kicker: string; title: string; cards: RolesCard[]; note: string; button: string };

export function rolesView(state: MindReaderRoundState): RolesView {
  const r = m.roles;
  const lineup = lineupOf(state);
  const roles = currentRoles(state);
  const n = state.config.mindReader.predictions;
  if (!lineup || !roles || !state.match) {
    return {
      kicker: format(r.quick.kicker, { n: state.word }),
      title: r.quick.title,
      cards: [
        { label: r.reader, title: r.quick.reader, color: null, detail: plural(n, r.readerDetail) },
        { label: r.clueGiver, title: r.quick.clueGiver, color: null, detail: r.clueDetail },
        { label: r.guessers, title: r.quick.guessers, color: null, detail: r.guessersDetail },
      ],
      note: r.noteOne,
      button: r.quick.show,
    };
  }
  const kicker = format(r.round, { round: roles.round, rounds: state.match.setup.rounds });
  const clue = playerName(lineup, roles.clueGiver);
  if (lineup.style === 'teams') {
    const readers = team(lineup, roles.readerTeamId)!;
    const guessing = team(lineup, roles.clueTeamId)!;
    return {
      kicker,
      title: format(r.title, { whose: possessive(readers.name) }),
      cards: [
        { label: r.readers, title: readers.name, color: readers.color, detail: format(r.readersDetail, { names: listNames(namesOf(lineup, roles.mindReaders)) }) },
        { label: r.clueGiver, title: clue, color: null, detail: format(r.clueDetailTeams, { team: guessing.name }) },
        { label: r.guessing, title: guessing.name, color: guessing.color, detail: format(r.guessingDetail, { names: listNames(namesOf(lineup, roles.guessers)) }) },
      ],
      note: r.noteTeams,
      button: r.showTeams,
    };
  }
  const reader = playerName(lineup, roles.mindReaders[0] ?? '');
  return {
    kicker,
    title: format(r.title, { whose: possessive(reader) }),
    cards: [
      { label: r.reader, title: reader, color: null, detail: plural(n, r.readerDetail) },
      { label: r.clueGiver, title: clue, color: null, detail: r.clueDetail },
      { label: r.guessers, title: listNames(namesOf(lineup, roles.guessers)), color: null, detail: r.guessersDetail },
    ],
    note: r.noteOne,
    button: format(r.showIndividual, { name: reader }),
  };
}

// --- Predict and show ----------------------------------------------------------------------------

export type PredictView = { kicker: string; label: string; hint: string | null; note: string | null; button: string; ready: boolean };

export function predictView(state: MindReaderRoundState): PredictView {
  const p = m.predict;
  const lineup = lineupOf(state);
  const roles = currentRoles(state);
  const needed = predictionsNeeded(state);
  const label = format(p.label, { n: state.config.mindReader.predictions });
  if (!lineup || !roles) {
    const practice = state.play === 'practice';
    return {
      kicker: practice ? p.kickerPractice : p.kickerQuick,
      label,
      hint: practice ? null : p.hintQuick,
      note: practice ? null : p.noteQuick,
      button: needed > 0 ? format(p.writeMore, { n: needed }) : p.doneQuick,
      ready: needed === 0,
    };
  }
  const clue = playerName(lineup, roles.clueGiver);
  const teams = lineup.style === 'teams';
  const readers = teams ? (team(lineup, roles.readerTeamId)?.name ?? '') : playerName(lineup, roles.mindReaders[0] ?? '');
  return {
    kicker: format(p.kicker, { name: readers }),
    label,
    hint: format(p.hint, { name: clue }),
    note: teams ? format(p.noteTeams, { team: team(lineup, roles.clueTeamId)?.name ?? '' }) : p.noteIndividual,
    button: needed > 0 ? format(p.writeMore, { n: needed }) : format(p.done, { name: clue }),
    ready: needed === 0,
  };
}

// Practice names the step in a quiet line and leaves the rest to its coach card: no title, no hint.
export type ShowView = { kicker: string | null; title: string | null; guessers: string; keep: string | null; gives: string | null; button: string };

export function showView(state: MindReaderRoundState): ShowView {
  const s = m.show;
  const lineup = lineupOf(state);
  const roles = currentRoles(state);
  if (state.play === 'practice') {
    return { kicker: s.titleQuick, title: null, guessers: s.guessersQuick, keep: null, gives: null, button: s.seenQuick };
  }
  if (!lineup || !roles) {
    return { kicker: null, title: s.titleQuick, guessers: s.guessersQuick, keep: s.keep, gives: s.givesCluesQuick, button: s.seenQuick };
  }
  const clue = playerName(lineup, roles.clueGiver);
  const guessers = namesOf(lineup, roles.guessers);
  return {
    kicker: format(s.kicker, { name: clue }),
    title: format(s.title, { name: clue }),
    guessers: plural(guessers.length, s.guessers, { names: listNames(guessers) }),
    keep: s.keep,
    gives: format(s.givesClues, { name: clue }),
    button: format(s.seen, { name: clue }),
  };
}

// --- Clues ---------------------------------------------------------------------------------------

export type SpokenRow = { label: string; word: string; time: string };
export type CluesView = {
  clock: string;
  // "Owls guess now: 3 + 4 = 7 points", or null with no time limit.
  guessNow: string | null;
  correct: string;
  spoken: SpokenRow[];
  countUp: string | null;
  // One button with a time limit (time running out ends the turn); Not guessed and Guessed it! without.
  guessed: string;
  notGuessed: string | null;
};

function guessValue(state: MindReaderRoundState, secondsLeft: number | null): string {
  const points = guessPoints(secondsLeft, state.config);
  const base = guessPoints(null, state.config);
  const pts = plural(points, m.results.points);
  return secondsLeft === null ? pts : format(m.clues.value, { base, bonus: points - base, points: pts });
}

export function spokenRows(state: Pick<MindReaderRoundState, 'limit' | 'predictions'>, entries: TurnResult['spoken']): SpokenRow[] {
  return entries.map((e) => {
    const word = state.predictions[e.prediction]?.trim() ?? '';
    const time = formatClock(spokenClock(state, e));
    return { label: format(m.clues.entry, { time, word }), word, time };
  });
}

export function cluesView(state: MindReaderRoundState): CluesView {
  const c = m.clues;
  const lineup = lineupOf(state);
  const roles = currentRoles(state);
  const clueTeam = lineup && roles ? team(lineup, roles.clueTeamId) : null;
  const timed = state.limit !== null;
  const practice = state.play === 'practice';
  const value = timed ? guessValue(state, mindReaderClock(state)) : null;
  return {
    clock: formatClock(mindReaderClock(state)),
    guessNow: value === null ? null : clueTeam ? format(c.guessNowTeam, { team: clueTeam.name, value }) : format(c.guessNow, { value }),
    correct: plural(state.spoken.length, c.correct),
    spoken: spokenRows(state, state.spoken),
    // Practice keeps to Guessed it! and its coach card.
    countUp: timed || practice ? null : c.countUp,
    guessed: clueTeam ? format(c.guessedTeam, { team: clueTeam.name }) : c.guessed,
    notGuessed: timed || practice ? null : c.notGuessed,
  };
}

// --- Turn over, fix, scores and results ------------------------------------------------------------

export type PointsRow = { title: string; detail: string; points: string };
export type SidePoints = MindReaderSide & { total: string; rows: PointsRow[] };
export type OverView = { kicker: string; word: string; sides: SidePoints[]; button: string };

export function overView(state: MindReaderRoundState): OverView | null {
  const turn = lastTurn(state);
  if (!turn || !state.match) return null;
  const o = m.over;
  const { result, roles } = turn;
  const pts = turnPoints(result, state.config);
  const clue = sideOf(state, roles.clueSide);
  const teams = isTeams(state);
  const time = result.secondsLeft === null ? null : formatClock(result.secondsLeft);
  const kicker = !result.guessed
    ? time === null
      ? o.notGuessed
      : o.timeUp
    : time === null
      ? teams
        ? format(o.guessedSide, { side: clue.name })
        : o.guessedAnon
      : teams
        ? format(o.guessedWith, { side: clue.name, time })
        : format(o.guessedWithAnon, { time });
  const { guess, bonusPoints, bonusEverySeconds } = state.config.mindReader.scoring;
  const plus = (n: number) => format(o.points, { n });
  const sides: SidePoints[] = [];
  if (result.guessed) {
    sides.push({
      ...clue,
      total: plus(pts.clueSide),
      rows: [
        time === null
          ? { title: o.flatGuess, detail: o.flatGuessDetail, points: plus(pts.guess) }
          : { title: o.fastGuess, detail: format(o.fastGuessDetail, { base: guess, per: bonusPoints, every: bonusEverySeconds }), points: plus(pts.guess) },
      ],
    });
  }
  const readerRows: PointsRow[] = [{ title: o.predictions, detail: plural(correctPredictions(result), o.predictionsDetail), points: plus(pts.predictions) }];
  if (!result.guessed) readerRows.push({ title: o.notGuessedBonus, detail: o.notGuessedDetail, points: plus(pts.notGuessed) });
  sides.push({ ...sideOf(state, roles.readerSide), total: plus(pts.readerSide), rows: readerRows });
  return { kicker, word: turn.word, sides, button: nextRoles(state) ? o.seeScores : o.seeResults };
}

// The Fix this turn sheet's labels for the turn just played.
export function fixLabels(state: MindReaderRoundState): { got: string } | null {
  const turn = lastTurn(state);
  if (!turn) return null;
  const clue = sideOf(state, turn.roles.clueSide);
  return { got: format(m.fix.got, { side: isTeams(state) ? clue.name : m.cards.clueGiver }) };
}

export type ScoreRow = MindReaderSide & { rank: number; total: number; last: string | null };
export type ScoresView = { kicker: string; rows: ScoreRow[]; next: string; nextClues: string; nextColor: number | null; clueColor: number | null; hand: string; button: string };

function scoreRows(state: MindReaderRoundState, withLast: boolean): ScoreRow[] {
  return matchStandings(state).map((row, i) => ({
    ...sideOf(state, row.side),
    rank: i + 1,
    total: row.total,
    last: withLast && row.last > 0 ? format(m.over.points, { n: row.last }) : null,
  }));
}

export function scoresView(state: MindReaderRoundState): ScoresView | null {
  const lineup = lineupOf(state);
  const turn = lastTurn(state);
  const next = nextRoles(state);
  if (!lineup || !turn || !next || !state.match) return null;
  const s = m.scores;
  const params = { round: turn.roles.round, rounds: state.match.setup.rounds };
  const clue = playerName(lineup, next.clueGiver);
  const guessers = listNames(namesOf(lineup, next.guessers));
  const teams = lineup.style === 'teams';
  const readers = teams ? team(lineup, next.readerTeamId)! : { name: playerName(lineup, next.mindReaders[0] ?? ''), color: null };
  const clueTeam = team(lineup, next.clueTeamId);
  return {
    kicker: format(endsRound(lineup, turn.roles.turn) ? s.afterRound : s.duringRound, params),
    rows: scoreRows(state, true),
    next: teams ? format(s.nextTeams, { team: readers.name }) : format(s.nextIndividual, { name: readers.name }),
    nextClues: teams ? format(s.nextClueTeams, { name: clue, team: clueTeam?.name ?? '', guessers }) : format(s.nextClueIndividual, { name: clue, guessers }),
    nextColor: readers.color,
    clueColor: clueTeam?.color ?? null,
    hand: format(s.hand, { name: readers.name }),
    button: format(s.start, { whose: possessive(readers.name) }),
  };
}

export type ResultsView = { kicker: string; title: string; sub: string; rows: ScoreRow[] };

export function resultsView(state: MindReaderRoundState): ResultsView | null {
  if (!state.match) return null;
  const r = m.results;
  const standings = matchStandings(state);
  const top = winners(standings);
  const best = standings[0];
  const winner = top.length === 1 && top[0] ? sideOf(state, top[0]) : null;
  return {
    kicker: plural(state.match.setup.rounds, r.kicker),
    title: winner ? format(isTeams(state) ? r.winTeam : r.winPlayer, { team: winner.name, name: winner.name }) : r.tie,
    sub: best ? format(r.sub, { points: plural(best.total, r.points), predictions: plural(best.predictions, r.predictions) }) : '',
    rows: scoreRows(state, false),
  };
}

// --- Quick Play and practice -------------------------------------------------------------------------

export function quickOverView(state: MindReaderRoundState): { kicker: string; correct: string; said: string } {
  const said = [...new Set(state.spoken.map((e) => state.predictions[e.prediction]?.trim() ?? ''))].filter(Boolean);
  return {
    kicker: state.guessed ? m.quickOver.guessed : m.quickOver.notGuessed,
    correct: plural(state.spoken.length, m.clues.correct),
    said: said.join(', '),
  };
}

// Practice: the step (1 to 4) and its coach card.
export function practiceStep(state: MindReaderRoundState): { overline: string; step: number; total: number; coach: { label: string; body: string; action: string } | null } {
  const coach = m.practice.coach;
  const total = coach.length + 1;
  const step = state.phase === 'predict' ? 1 : state.phase === 'show' ? 2 : state.phase === 'clues' ? 3 : total;
  const card = coach[step - 1];
  return {
    overline: format(m.practice.overline, { step, total }),
    step,
    total,
    coach: card && state.coach ? { ...card, body: format(card.body, { n: state.config.mindReader.predictions }) } : null,
  };
}

// How scoring works, with the numbers from the rules.
export function scoringRows(state: Pick<MindReaderRoundState, 'config'>): { rows: PointsRow[]; example: string } {
  const sc = m.practice.scoring;
  const { guess, bonusPoints, bonusEverySeconds, perPrediction, notGuessed } = state.config.mindReader.scoring;
  const plus = (n: number) => format(sc.points, { n });
  const left = sc.exampleSecondsLeft;
  const value = guessPoints(left, state.config);
  return {
    rows: [
      { title: sc.fast.title, detail: format(sc.fast.detail, { guess, bonus: bonusPoints, every: bonusEverySeconds }), points: plus(guess) },
      { title: sc.spoken.title, detail: sc.spoken.detail, points: plus(perPrediction) },
      { title: sc.notGuessed.title, detail: sc.notGuessed.detail, points: plus(notGuessed) },
      { title: sc.individual.title, detail: format(sc.individual.detail, { guess }), points: plus(guess) },
    ],
    example: format(sc.example.body, {
      time: formatClock(left),
      sum: format(m.clues.value, { base: guess, bonus: value - guess, points: value }),
      twice: 2 * perPrediction,
    }),
  };
}

// The predictions shown as chips on the Clues screen, with their index (blanks never get there).
export function predictionChips(state: MindReaderRoundState): { index: number; word: string }[] {
  return state.predictions.map((word, index) => ({ index, word: word.trim() })).filter((p) => p.word);
}

// --- Quick Play difficulty ---------------------------------------------------------------------------

const badges = Object.fromEntries(DIFFICULTY_IDS.map((id) => [id, en.difficulties[id].badge])) as Record<Difficulty, string>;

// The header chip's text: "NORMAL", or "HARD+" for several difficulties.
export function difficultyBadge(difficulties: readonly Difficulty[]): string {
  return difficultyLabel(difficulties, { names: badges, mixed: en.difficultyMix });
}

const difficultyNames = Object.fromEntries(DIFFICULTY_IDS.map((id) => [id, en.difficulties[id].name])) as Record<Difficulty, string>;

// The picks by name: "Hard", or "Normal+" for several.
export function difficultyName(difficulties: readonly Difficulty[]): string {
  return difficultyLabel(difficulties, { names: difficultyNames, mixed: en.difficultyMix });
}

// The box on a Quick Play result: after a word that wasn't guessed, lower the difficulty when an
// easier one exists (none when it's already the easiest); once a new pick is applied, confirm it.
export function toughPrompt(
  difficulties: readonly Difficulty[],
  { guessed, applied }: { guessed: boolean; applied: boolean },
): { title: string; body: string; action: string } | null {
  const q = en.mindReader.quickOver;
  const name = difficultyName(difficulties);
  if (applied) return { title: format(q.applied, { name }), body: format(q.appliedNext, { name }), action: q.switchAgain };
  if (guessed || !hasEasierDifficulty(difficulties)) return null;
  return { title: q.tough, body: q.lower, action: q.switch };
}

// The difficulty sheet's primary button: "Apply difficulty", or "Apply difficulties" for several.
export function difficultyApplyLabel(difficulties: readonly Difficulty[]): string {
  return difficulties.length > 1 ? en.mindReader.quick.applyMany : en.mindReader.quick.apply;
}

// The difficulty sheet's note: "Pick one or more", or "2 difficulties · 1,507 cards".
export function difficultyPickNote(difficulties: readonly Difficulty[], cards: number): string {
  return difficulties.length === 1
    ? en.setup.difficultyHint
    : format(en.setup.difficultyPicked, { difficulties: plural(difficulties.length, en.units.difficulties), cards: plural(cards, en.units.cards) });
}
