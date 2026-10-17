import { describe, expect, it } from 'vitest';

import {
  addPlayer,
  canUseTeams,
  createRound,
  defaultVersusSetup,
  emptyLineup,
  gameConfig,
  nextOutcome,
  offersGuesserBonus,
  resumableSettings,
  roundReducer,
  setStyle,
  setTeamCount,
  turnScores,
  versusLineupConfig,
  versusLineupIssue,
  versusRoles,
  versusStandings,
  versusWinners,
  type Lineup,
  type PlayedCard,
  type RoundAction,
  type VersusRoundState,
  type VersusSetup,
  type VersusTurn,
} from '../src';
import { makeCards, run, settingsFor, times } from './fixtures';

const presets = ['Sharks', 'Owls', 'Foxes'].map((name, color) => ({ name, color }));
const named = (...names: string[]): Lineup => names.reduce((l, n) => addPlayer(l, n, versusLineupConfig()), emptyLineup());
const nameOf = (lineup: Lineup, id: string) => lineup.players.find((p) => p.id === id)!.name;
const teamName = (lineup: Lineup, id: string | null) => lineup.teams.find((t) => t.id === id)?.name;
const twoTeams = setStyle(named('Maya', 'Sam', 'Leo', 'Priya'), 'teams', presets, versusLineupConfig());
const pair = named('Maya', 'Leo');
const four = named('Maya', 'Sam', 'Leo', 'Ava');
const idOf = (lineup: Lineup, name: string) => lineup.players.find((p) => p.name === name)!.id;

const setup = (lineup: Lineup, over: Partial<VersusSetup> = {}): VersusSetup => ({ ...defaultVersusSetup(lineup), ...over });
const start = (lineup: Lineup, over: Partial<VersusSetup> = {}) =>
  createRound(settingsFor('versus'), { cards: makeCards(40), seed: 1, versus: setup(lineup, over) }) as VersusRoundState;
const play = (state: VersusRoundState, actions: RoundAction[]) => run(roundReducer, state, actions) as VersusRoundState;
const card = (outcome: PlayedCard['outcome'], guesser: string | null = null): PlayedCard => ({ word: 'W', outcome, guesser, ended: null });

describe('Versus players', () => {
  it('plays Individual from 2 players and Teams from 4, as the config says', () => {
    const { minPlayers, minPerTeam, minTeams } = gameConfig.versus.lineup;
    expect(versusLineupIssue(named('Maya'))).toEqual({ kind: 'tooFewPlayers', missing: minPlayers - 1 });
    expect(versusLineupIssue(pair)).toBeNull();
    expect(canUseTeams(3, versusLineupConfig())).toBe(false);
    expect(canUseTeams(minPerTeam * minTeams, versusLineupConfig())).toBe(true);
    expect(versusLineupIssue({ ...named('Maya', 'Leo', 'Priya'), style: 'teams' })).toEqual({ kind: 'teamsNeedPlayers', missing: 1 });
  });

  it('allows up to 6 teams and uneven teams, but not a team of one', () => {
    const seven = setStyle(named('A', 'B', 'C', 'D', 'E', 'F', 'G'), 'teams', presets, versusLineupConfig());
    const three = setTeamCount(seven, 3, presets, versusLineupConfig());
    expect(three.teams.map((t) => t.members.length)).toEqual([3, 2, 2]);
    expect(versusLineupIssue(three)).toBeNull();
    expect(setTeamCount(seven, 99, presets, versusLineupConfig()).teams).toHaveLength(gameConfig.versus.lineup.maxTeams);
    expect(versusLineupIssue(setTeamCount(seven, 4, presets, versusLineupConfig()))).toEqual({ kind: 'tooManyTeams', max: 3 });
  });

  it('opens the default mode after a restart, since the lineup lasts one session', () => {
    expect(resumableSettings(settingsFor('versus')).mode).toBe(gameConfig.defaults.mode);
    expect(resumableSettings(settingsFor('classic')).mode).toBe('classic');
  });
});

describe('Versus rotation', () => {
  it('Teams: teams alternate and each team’s Clue Giver rotates; the other team watches', () => {
    const roles = [0, 1, 2, 3, 4].map((t) => versusRoles(twoTeams, t));
    expect(roles.map((r) => [r.round, teamName(twoTeams, r.teamId), nameOf(twoTeams, r.clueGiver), r.guessers.map((g) => nameOf(twoTeams, g))])).toEqual([
      [1, 'Sharks', 'Maya', ['Sam']],
      [1, 'Owls', 'Leo', ['Priya']],
      [2, 'Sharks', 'Sam', ['Maya']],
      [2, 'Owls', 'Priya', ['Leo']],
      [3, 'Sharks', 'Maya', ['Sam']],
    ]);
    expect(roles[0]!.watchers.map((w) => nameOf(twoTeams, w))).toEqual(['Leo', 'Priya']);
  });

  it('Individual: everyone gives clues in turn order; everyone else guesses', () => {
    const roles = [0, 1, 2, 3, 4].map((t) => versusRoles(four, t));
    expect(roles.map((r) => [r.round, nameOf(four, r.clueGiver), r.guessers.length])).toEqual([
      [1, 'Maya', 3],
      [1, 'Sam', 3],
      [1, 'Leo', 3],
      [1, 'Ava', 3],
      [2, 'Maya', 3],
    ]);
  });
});

describe('Versus scoring', () => {
  const turn = (lineup: Lineup, t: number, cards: PlayedCard[]): VersusTurn => ({ roles: versusRoles(lineup, t), cards });
  const off = { penalty: false, penaltyPoints: 1, bonus: true };
  const on = { penalty: true, penaltyPoints: 2, bonus: true };

  it('Teams: +1 a correct card for the team; a banned word costs the penalty only when it is on', () => {
    const t = turn(twoTeams, 0, [card('correct'), card('correct'), card('notGuessed'), card('banned')]);
    expect(Object.fromEntries(turnScores(twoTeams, t, off))).toEqual({ t1: 2 });
    expect(Object.fromEntries(turnScores(twoTeams, t, on))).toEqual({ t1: 0 });
  });

  it('Individual with 3+, bonus on: the Clue Giver and every guesser get +1, and whoever got it +1 more', () => {
    const [maya, sam, leo, ava] = ['Maya', 'Sam', 'Leo', 'Ava'].map((n) => idOf(four, n));
    const t = turn(four, 0, [card('correct', sam!), card('correct', leo!), card('correct', sam!), card('banned')]);
    // 3 correct: Maya 3 − 2 for the banned word; Sam 3 + 2 bonus; Leo 3 + 1; Ava 3.
    expect(Object.fromEntries(turnScores(four, t, on))).toEqual({ [maya!]: 1, [sam!]: 5, [leo!]: 4, [ava!]: 3 });
    // Correct with nobody picked: everyone still gets +1, nobody the bonus.
    expect(Object.fromEntries(turnScores(four, turn(four, 0, [card('correct')]), off))).toEqual({ [maya!]: 1, [sam!]: 1, [leo!]: 1, [ava!]: 1 });
  });

  it('Individual with 3+, bonus off: the Clue Giver and every guesser get +1, and Correct asks nobody', () => {
    const [maya, sam, leo, ava] = ['Maya', 'Sam', 'Leo', 'Ava'].map((n) => idOf(four, n));
    const t = turn(four, 0, [card('correct', sam!), card('correct', leo!), card('banned')]);
    expect(Object.fromEntries(turnScores(four, t, { ...on, bonus: false }))).toEqual({ [maya!]: 0, [sam!]: 2, [leo!]: 2, [ava!]: 2 });
    const s = play(start(four, { bonus: false }), [{ type: 'startTurn' }, { type: 'correct' }, { type: 'endTurn' }]);
    expect(s.turns[0]!.cards[0]).toMatchObject({ outcome: 'correct', guesser: null });
    // With the bonus on, Correct waits for who got it.
    const waiting = play(start(four), [{ type: 'startTurn' }]);
    expect(play(waiting, [{ type: 'correct' }])).toBe(waiting);
  });

  it('Individual with 2: a correct card is +1 for both, never a bonus; a banned word with the penalty on costs the Clue Giver', () => {
    const [maya, leo] = ['Maya', 'Leo'].map((n) => idOf(pair, n));
    const t = turn(pair, 0, [card('correct', leo!), card('banned')]);
    expect(Object.fromEntries(turnScores(pair, t, { penalty: true, penaltyPoints: 1, bonus: true }))).toEqual({ [maya!]: 0, [leo!]: 1 });
  });

  it('offers the bonus switch only for Individual with 3 or more players', () => {
    expect([pair, named('Maya', 'Sam', 'Leo'), four, twoTeams].map((l) => offersGuesserBonus(l))).toEqual([false, true, true, false]);
  });

  it('adds up standings with the latest round’s points, and the split for Individual results', () => {
    const [maya, sam] = ['Maya', 'Sam'].map((n) => idOf(four, n));
    const turns = [turn(four, 0, [card('correct', sam!), card('banned')]), turn(four, 4, [card('correct', sam!)])];
    const rows = versusStandings(setup(four, on), turns);
    const m = rows.find((r) => r.side === maya)!;
    expect(m).toMatchObject({ total: 0, last: 1, correct: 2, banned: 1, asClueGiver: 2, guessing: 0, bonus: 0, penalty: 2 });
    // Sam: +1 guessing on Maya's 2 correct cards, +1 bonus for each.
    expect(rows[0]).toMatchObject({ side: sam, total: 4, guessing: 2, bonus: 2 });
    expect(versusWinners(rows)).toEqual([sam]);
  });
});

describe('Versus recap', () => {
  it('cycles a card Correct → Not guessed → Banned word → Correct', () => {
    expect(nextOutcome('correct')).toBe('notGuessed');
    expect(nextOutcome('notGuessed')).toBe('banned');
    expect(nextOutcome('banned')).toBe('correct');
  });

  it('a tap changes the card and the totals with it, and the guesser comes back on Correct', () => {
    const recap = play(start(four), [{ type: 'startTurn' }, { type: 'correct', guesser: idOf(four, 'Leo') }, { type: 'endTurn' }]);
    const leo = idOf(four, 'Leo');
    const totalOf = (s: VersusRoundState, id: string) => versusStandings(s.setup, s.turns).find((r) => r.side === id)!.total;
    // +1 guessing, +1 bonus.
    expect(totalOf(recap, leo)).toBe(2);
    const changed = play(recap, [{ type: 'cycleCard', index: 0 }]);
    expect(changed.turns[0]!.cards[0]!.outcome).toBe('notGuessed');
    expect(totalOf(changed, leo)).toBe(0);
    const back = play(changed, [{ type: 'cycleCard', index: 0 }, { type: 'cycleCard', index: 0 }]);
    expect(back.turns[0]!.cards[0]).toMatchObject({ outcome: 'correct', guesser: leo });
    expect(totalOf(back, leo)).toBe(2);
  });

  it('with 2 players, a skipped card made Correct credits the guesser', () => {
    const recap = play(start(pair), [{ type: 'startTurn' }, { type: 'skip' }, { type: 'endTurn' }]);
    const fixed = play(recap, [{ type: 'cycleCard', index: 0 }, { type: 'cycleCard', index: 0 }]);
    expect(fixed.turns[0]!.cards[0]).toMatchObject({ outcome: 'correct', guesser: idOf(pair, 'Leo') });
  });
});

describe('Versus turns', () => {
  it('starts on the pass screen, then runs the turn’s clock', () => {
    const s = start(twoTeams);
    expect(s.phase).toBe('pass');
    const turn = play(s, [{ type: 'startTurn' }, { type: 'tick', seconds: 18 }]);
    expect(turn.clock).toEqual({ total: gameConfig.versus.turnSeconds, left: gameConfig.versus.turnSeconds - 18 });
  });

  it('allows the setup’s skips per turn, then no more; skipped cards are Not guessed', () => {
    const s = play(start(twoTeams, { skips: 2 }), [{ type: 'startTurn' }, ...times(3, { type: 'skip' } as const), { type: 'endTurn' }]);
    expect(s.turns[0]!.cards.map((c) => [c.outcome, c.ended])).toEqual([
      ['notGuessed', 'skipped'],
      ['notGuessed', 'skipped'],
      ['notGuessed', null],
    ]);
  });

  it('when time runs out, the card on screen counts as Not guessed and the recap opens', () => {
    const s = play(start(twoTeams, { turnSeconds: 30 }), [{ type: 'startTurn' }, { type: 'correct' }, { type: 'tick', seconds: 30 }]);
    expect(s.phase).toBe('recap');
    expect(s.turns[0]!.cards.map((c) => [c.outcome, c.ended])).toEqual([
      ['correct', null],
      ['notGuessed', 'timeUp'],
    ]);
    expect(play(s, [{ type: 'correct' }, { type: 'tick', seconds: 5 }])).toEqual(s);
  });

  it('Individual with 3+ needs to know who got it; with 2 the guesser is the other player', () => {
    const s = play(start(four), [{ type: 'startTurn' }]);
    expect(play(s, [{ type: 'correct' }]).cards).toHaveLength(0);
    expect(play(s, [{ type: 'correct', guesser: idOf(four, 'Ava') }]).cards[0]!.guesser).toBe(idOf(four, 'Ava'));
    const two = play(start(pair), [{ type: 'startTurn' }, { type: 'correct' }]);
    expect(two.cards[0]!.guesser).toBe(idOf(pair, 'Leo'));
  });

  it('with no time limit there is no clock; the Clue Giver ends the turn', () => {
    const s = play(start(twoTeams, { noTimeLimit: true }), [{ type: 'startTurn' }, { type: 'tick', seconds: 500 }]);
    expect([s.phase, s.clock]).toEqual(['turn', null]);
    expect(play(s, [{ type: 'endTurn' }]).phase).toBe('recap');
  });

  it('pausing stops the clock and the answers until resumed', () => {
    const s = play(start(twoTeams), [{ type: 'startTurn' }, { type: 'pause' }, { type: 'tick', seconds: 10 }, { type: 'correct' }]);
    expect([s.clock?.left, s.cards.length]).toEqual([gameConfig.versus.turnSeconds, 0]);
    expect(play(s, [{ type: 'resume' }, { type: 'correct' }]).cards).toHaveLength(1);
  });

  it('after every team has given clues the scores show, and after the last round the results', () => {
    const turnOf = (): RoundAction[] => [{ type: 'startTurn' }, { type: 'correct' }, { type: 'endTurn' }, { type: 'next' }];
    const one = play(start(twoTeams, { rounds: 2 }), turnOf());
    expect(one.phase).toBe('pass');
    const roundOver = play(one, turnOf());
    expect(roundOver.phase).toBe('scores');
    const done = play(roundOver, [{ type: 'next' }, ...turnOf(), ...turnOf()]);
    expect([done.phase, done.turns.length]).toEqual(['results', 4]);
    expect(play(done, [{ type: 'next' }, { type: 'startTurn' }])).toEqual(done);
  });

  it('keeps the setup inside the config’s ranges and refuses a lineup that can’t play', () => {
    expect(start(twoTeams, { rounds: 99, skips: -4, penaltyPoints: 50 }).setup).toMatchObject({
      rounds: gameConfig.versus.rounds.max,
      skips: gameConfig.versus.skips.min,
      penaltyPoints: gameConfig.versus.penalty.points.max,
    });
    expect(() => start(named('Maya'))).toThrow();
  });
});
