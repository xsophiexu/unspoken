import { describe, expect, it } from 'vitest';

import {
  addPlayer,
  bannedShown,
  defaultVersusSetup,
  emptyLineup,
  versusLineupConfig,
  canAnswer,
  cardsForSettings,
  cardsForSpecialties,
  createRound,
  createSwipeRound,
  dealFromBank,
  defaultSettings,
  hasOptionalRules,
  isClockRunning,
  isSwipeOver,
  isSwipeWon,
  mdGameConfig,
  normalizeBank,
  parseSettings,
  roundReducer,
  scoreTargetOf,
  skipsLeft,
  specialtyCounts,
  stepWithin,
  swipeCard,
  swipeReducer,
  toggleSpecialty,
  type BankCardInput,
  type GameSettings,
  type SwipeAction,
  type SwipeRoundState,
} from '../src';
import { makeCards, run, times } from './fixtures';

const config = mdGameConfig;
const cards = makeCards(30, 6);
const md = (overrides: Partial<GameSettings> = {}): GameSettings => ({ ...defaultSettings(config), ...overrides });
const start = (overrides: Partial<GameSettings> = {}) => createSwipeRound(md(overrides), { cards, seed: 1, config });
const play = (state: SwipeRoundState, actions: SwipeAction[]) => run(swipeReducer, state, actions);

describe('UnspokenMD settings', () => {
  it('start in Zen at Tricky with All specialties and every optional rule off', () => {
    const s = defaultSettings(config);
    expect(s).toMatchObject({ mode: 'zen', difficulties: ['Tricky'], specialties: [], noTimeLimit: true, noSkipLimit: true, noScoreTarget: true });
    expect(hasOptionalRules(s.mode, config)).toBe(true);
  });

  it('keep a 1:30 timer, 3 skips and a score of 10 ready for when a rule is turned on', () => {
    const s = defaultSettings(config);
    expect(s.roundSeconds).toBe(90);
    expect(skipsLeft(start({ noSkipLimit: false }))).toBe(3);
    expect(scoreTargetOf({ ...s, noScoreTarget: false }, config)).toBe(10);
  });

  it('round-trip through saved data, dropping specialties the edition does not have', () => {
    const saved = md({ specialties: ['renal', 'cardiovascular'], noTimeLimit: false, roundSeconds: 150, noScoreTarget: false, scoreTarget: 15 });
    const parsed = parseSettings(JSON.parse(JSON.stringify({ ...saved, specialties: ['renal', 'Pop Culture', 'cardiovascular'] })), config);
    expect(parsed).toEqual({ ...saved, specialties: ['cardiovascular', 'renal'] });
  });

  it('fall back to the defaults for a missing or bad save', () => {
    expect(parseSettings(undefined, config)).toEqual(defaultSettings(config));
    expect(parseSettings({ mode: 'classic', scoreTarget: 'ten', difficulties: ['Easy'] }, config)).toEqual(defaultSettings(config));
  });

  it('keep a saved score target within the Correct to win stepper', () => {
    expect(parseSettings({ scoreTarget: 500 }, config).scoreTarget).toBe(config.zen!.scoreTarget.max);
  });

  it('leave Unspoken saves without MD fields', () => {
    expect(parseSettings({ mode: 'endless' })).not.toHaveProperty('specialties');
    expect(parseSettings({ mode: 'endless' })).not.toHaveProperty('noSkipLimit');
  });

  it('offer no Easy difficulty and none of Unspoken’s modes but Versus', () => {
    expect(config.difficulties.map((d) => d.id)).not.toContain('Easy');
    expect(config.modes.map((m) => m.id)).toEqual(['zen', 'versus', 'ladder']);
  });
});

describe('specialty picks', () => {
  it('toggle like categories, with All specialties clearing them and catalog order kept', () => {
    const picked = toggleSpecialty(toggleSpecialty([], 'renal', config), 'cardiovascular', config);
    expect(picked).toEqual(['cardiovascular', 'renal']);
    expect(toggleSpecialty(picked, 'renal', config)).toEqual(['cardiovascular']);
    expect(toggleSpecialty(picked, null, config)).toEqual([]);
  });

  it('steppers stay within their range', () => {
    const stepper = { default: 3, min: 0, max: 10 };
    expect(stepWithin(3, 1, stepper)).toBe(4);
    expect(stepWithin(0, -1, stepper)).toBe(0);
    expect(stepWithin(10, 1, stepper)).toBe(10);
  });
});

describe('dealing from the MD bank', () => {
  const raw: BankCardInput[] = [
    { word: 'Asthma', difficulty: 'Normal', specialty: 'respiratory', banned: ['Wheeze', 'Albuterol', 'IgE', 'Bronchospasm', 'Eosinophils', 'Curschmann spirals'] },
    { word: 'Gout', difficulty: 'Normal', specialty: 'musculoskeletalSkin', banned: ['Uric acid', 'Podagra', 'Tophi', 'Colchicine', 'Allopurinol', 'Negatively birefringent'] },
    { word: 'Pneumothorax', difficulty: 'Tough', specialty: 'respiratory', banned: ['Tension', 'Hyperresonance', 'Tracheal deviation', 'Bleb', 'Absent breath sounds', 'Needle decompression'] },
    { word: 'Vasculitis', difficulty: 'Tough', specialty: 'cardiovascular', banned: ['p-ANCA', 'c-ANCA', 'hCG', 'p53', 'Steroids', 'Biopsy'] },
  ];
  const bank = normalizeBank(raw, { keepCase: true });
  const words = (list: { word: string }[]) => list.map((c) => c.word).sort();

  it('draws from the picked specialties at the picked difficulties', () => {
    expect(words(cardsForSpecialties(bank, ['Normal', 'Tough'], ['respiratory']))).toEqual(['Asthma', 'Pneumothorax']);
    expect(words(cardsForSpecialties(bank, 'Normal', ['respiratory']))).toEqual(['Asthma']);
  });

  it('draws from every specialty when none is picked', () => {
    expect(words(cardsForSpecialties(bank, ['Normal', 'Tough'], []))).toEqual(['Asthma', 'Gout', 'Pneumothorax', 'Vasculitis']);
  });

  it('picks specialties or categories by the settings’ edition', () => {
    expect(words(cardsForSettings(bank, md({ difficulties: ['Tough'], specialties: ['cardiovascular'] }), config))).toEqual(['Vasculitis']);
    // Unspoken settings filter by category, and these cards have none.
    expect(cardsForSettings(bank, md({ difficulties: ['Tough'], categories: ['Society'] }))).toEqual([]);
  });

  it('counts each specialty’s cards for the Choose specialties sheet', () => {
    expect(specialtyCounts(bank, ['Normal', 'Tough'])).toMatchObject({ respiratory: 2, cardiovascular: 1, renal: 0 });
  });

  it('deals the same specialty deck for the same seed', () => {
    const request = { difficulties: ['Normal', 'Tough'] as const, categories: [], specialties: ['respiratory' as const], mode: 'ladder' as const, seed: 9 };
    const a = dealFromBank(bank, request, config);
    expect(a.total).toBe(2);
    expect(dealFromBank(bank, request, config)).toEqual(a);
  });

  it('keeps jargon that starts lowercase as written', () => {
    expect(bank.find((c) => c.word === 'Vasculitis')!.banned.slice(0, 4)).toEqual(['p-ANCA', 'c-ANCA', 'hCG', 'p53']);
  });
});

describe('Zen', () => {
  it('plays like Endless with every rule off: no clock, unlimited skips, no end', () => {
    const state = play(start(), [...times<SwipeAction>(40, { type: 'skip' }), ...times<SwipeAction>(60, { type: 'correct' })]);
    expect(state.clock).toBeNull();
    expect(skipsLeft(state)).toBeNull();
    expect(state.correct).toBe(60);
    expect(isSwipeOver(state)).toBe(false);
  });

  it('shows all 6 banned terms at every difficulty', () => {
    expect(swipeCard(start({ difficulties: ['Normal'] }))!.banned).toHaveLength(6);
  });

  it('with the timer on, ends the game when time runs out', () => {
    const timed = start({ noTimeLimit: false });
    expect(timed.clock).toEqual({ total: 90, left: 90 });
    expect(isClockRunning(timed)).toBe(true);
    const over = play(timed, [{ type: 'tick', seconds: 90 }]);
    expect(isSwipeOver(over)).toBe(true);
    expect(canAnswer(over, 'correct')).toBe(false);
  });

  it('with the skip limit on, stops skipping when the skips run out', () => {
    const state = play(start({ noSkipLimit: false, skips: 2 }), times(2, { type: 'skip' }));
    expect(skipsLeft(state)).toBe(0);
    expect(canAnswer(state, 'skip')).toBe(false);
    expect(canAnswer(state, 'correct')).toBe(true);
  });

  it('with Play to a score on, ends the game won at that many correct', () => {
    const almost = play(start({ noScoreTarget: false, scoreTarget: 3 }), [...times<SwipeAction>(2, { type: 'correct' }), { type: 'skip' }]);
    expect(isSwipeOver(almost)).toBe(false);
    const won = play(almost, [{ type: 'correct' }]);
    expect(isSwipeWon(won)).toBe(true);
    expect(isSwipeOver(won)).toBe(true);
    expect(play(won, [{ type: 'correct' }])).toBe(won);
  });

  it('ignores a kept score while Play to a score is off', () => {
    expect(isSwipeOver(play(start({ noScoreTarget: true, scoreTarget: 1 }), [{ type: 'correct' }]))).toBe(false);
  });
});

describe('Ladder', () => {
  const ladder = () => start({ mode: 'ladder', skips: 3 });

  it('starts with 3 banned terms and adds one per correct answer up to all 6', () => {
    let state = ladder();
    const shown = [bannedShown(state)];
    for (let i = 0; i < 3; i++) {
      state = play(state, [{ type: 'correct' }]);
      shown.push(bannedShown(state));
    }
    expect(shown).toEqual([3, 4, 5, 6]);
    expect(swipeCard(state)!.banned).toHaveLength(6);
  });

  it('adds nothing for a skip', () => {
    expect(bannedShown(play(ladder(), [{ type: 'skip' }]))).toBe(3);
  });

  it('is won by one correct answer with all 6 showing', () => {
    const atTop = play(ladder(), times(3, { type: 'correct' }));
    expect(isSwipeWon(atTop)).toBe(false);
    const won = play(atTop, [{ type: 'correct' }]);
    expect(isSwipeWon(won)).toBe(true);
    expect(isSwipeOver(won)).toBe(true);
  });

  it('marks the newly added term until all 6 show', () => {
    expect(swipeCard(play(ladder(), [{ type: 'correct' }]))!.freshIndex).toBe(3);
  });
});

describe('Versus in UnspokenMD', () => {
  it('starts a Versus round on the MD config with Unspoken’s Versus setup', () => {
    const lineup = ['Maya', 'Leo'].reduce((l, n) => addPlayer(l, n, versusLineupConfig(config)), emptyLineup());
    const state = createRound(md({ mode: 'versus' }), { cards, seed: 1, config, versus: defaultVersusSetup(lineup, config) });
    expect(state.kind).toBe('versus');
  });
});

describe('playing a card from search', () => {
  const searched = { id: 'searched', word: 'Pneumothorax', banned: ['Tension', 'Hyperresonance', 'Tracheal deviation', 'Bleb', 'Absent breath sounds', 'Needle decompression'] };

  it('shows the card now, marked as from search, then carries on with the card that was showing', () => {
    const before = start();
    const showing = swipeCard(before)!.card;
    const pulled = play(before, [{ type: 'showCard', card: searched }]);
    expect(swipeCard(pulled)!.card).toEqual(searched);
    expect(pulled.fromSearch).toBe(true);
    const after = play(pulled, [{ type: 'skip' }]);
    expect(swipeCard(after)!.card).toEqual(showing);
    expect(after.fromSearch).toBe(false);
  });

  it('counts the searched card like any other', () => {
    const state = run(roundReducer, start() as Parameters<typeof roundReducer>[0], [{ type: 'showCard', card: searched }, { type: 'correct' }]);
    expect(state.kind === 'swipe' && state.correct).toBe(1);
  });
});
