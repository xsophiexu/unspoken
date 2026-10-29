import { describe, expect, it } from 'vitest';

import {
  cardsByDifficulty,
  createSwipeRound,
  dealEasiestFirst,
  deepDiveSettings,
  difficultySpan,
  extendedGameConfig,
  homeQuickPlaySettings,
  isHomeQuickPlay,
  mdGameConfig,
  normalizeBank,
  seededRandom,
  singlePick,
  swipeCard,
  swipeReducer,
  type BankCardInput,
  type Card,
  type Difficulty,
  type SwipeRoundState,
} from '../src';
import { makeCards } from './fixtures';

const banned = (w: string) => Array.from({ length: 6 }, (_, i) => `${w} ban ${i}`);

// Three cards at each of three difficulties in Cardiology, and two Renal cards that never belong.
const mdRaw: BankCardInput[] = (['Normal', 'Tricky', 'Legend'] as const).flatMap((difficulty) =>
  [1, 2, 3].map((n) => ({ word: `${difficulty} ${n}`, banned: banned(difficulty), difficulty, specialty: 'cardiovascular' as const })),
);
mdRaw.push({ word: 'Kidney 1', banned: banned('K'), difficulty: 'Normal', specialty: 'renal' }, { word: 'Kidney 2', banned: banned('K'), difficulty: 'Hard', specialty: 'renal' });
const mdBank = normalizeBank(mdRaw, { keepCase: true });
const levelOf = (card: Card) => mdBank.find((c) => c.id === card.id)?.difficulty;

const names = { Easy: 'Easy', Normal: 'Normal', Tricky: 'Tricky', Hard: 'Hard', Tough: 'Tough', Expert: 'Expert', Elite: 'Elite', Master: 'Master', Legend: 'Legend' } satisfies Record<Difficulty, string>;
const badges = Object.fromEntries(Object.entries(names).map(([id, name]) => [id, name.toUpperCase()])) as Record<Difficulty, string>;

describe('dealEasiestFirst', () => {
  it('deals every card once, each group before the next, shuffled within the group', () => {
    const easy = makeCards(12).map((c) => ({ ...c, id: `easy-${c.id}` }));
    const hard = makeCards(12).map((c) => ({ ...c, id: `hard-${c.id}` }));
    const deck = dealEasiestFirst([easy, hard], seededRandom(3).random);
    expect(deck.slice(0, 12).every((c) => c.id.startsWith('easy-'))).toBe(true);
    expect(deck.slice(12).every((c) => c.id.startsWith('hard-'))).toBe(true);
    expect(new Set(deck.map((c) => c.id)).size).toBe(24);
    // Shuffled, not left in the order given.
    expect(deck.slice(0, 12).map((c) => c.id)).not.toEqual(easy.map((c) => c.id));
  });

  it('deals the same order for the same seed', () => {
    const groups = [makeCards(8), makeCards(8).map((c) => ({ ...c, id: `b-${c.id}` }))];
    expect(dealEasiestFirst(groups, seededRandom(9).random)).toEqual(dealEasiestFirst(groups, seededRandom(9).random));
  });
});

describe('cardsByDifficulty', () => {
  it('groups a specialty’s cards by difficulty, easiest first, leaving out empty difficulties', () => {
    const settings = deepDiveSettings('cardiovascular', true, mdGameConfig);
    const groups = cardsByDifficulty(mdBank, settings, mdGameConfig);
    expect(groups.map((group) => group.map(levelOf))).toEqual([
      ['Normal', 'Normal', 'Normal'],
      ['Tricky', 'Tricky', 'Tricky'],
      ['Legend', 'Legend', 'Legend'],
    ]);
  });
});

describe('Deep dive', () => {
  const play = (easiestFirst: boolean, seed: number) => {
    const settings = deepDiveSettings('cardiovascular', easiestFirst, mdGameConfig);
    const groups = cardsByDifficulty(mdBank, settings, mdGameConfig);
    return createSwipeRound(settings, { cards: groups.flat(), groups: easiestFirst ? groups : undefined, seed, config: mdGameConfig });
  };
  // The difficulties of the next n cards, answering each one.
  const levels = (round: SwipeRoundState, n: number) => {
    const seen: (Difficulty | undefined)[] = [];
    let state = round;
    for (let i = 0; i < n; i++) {
      seen.push(levelOf(swipeCard(state)!.card));
      state = swipeReducer(state, { type: 'correct' });
    }
    return seen;
  };

  it('plays one specialty at every difficulty in the default mode', () => {
    const settings = deepDiveSettings('cardiovascular', true, mdGameConfig);
    expect(settings).toMatchObject({ mode: 'zen', specialties: ['cardiovascular'], easiestFirst: true });
    expect(settings.difficulties).toEqual(['Normal', 'Tricky', 'Hard', 'Tough', 'Expert', 'Elite', 'Master', 'Legend']);
    expect(singlePick(settings, mdGameConfig)).toBe('cardiovascular');
  });

  it('picks one category from Easy to Legend in Unspoken', () => {
    const settings = deepDiveSettings('Everyday Life', false, extendedGameConfig);
    expect(settings).toMatchObject({ mode: 'endless', categories: ['Everyday Life'], easiestFirst: false });
    expect(settings.difficulties[0]).toBe('Easy');
    expect(settings.difficulties.at(-1)).toBe('Legend');
    expect(singlePick(settings, extendedGameConfig)).toBe('Everyday Life');
  });

  it('deals Normal up to Legend with Easiest first, and again after the last card', () => {
    const order = ['Normal', 'Normal', 'Normal', 'Tricky', 'Tricky', 'Tricky', 'Legend', 'Legend', 'Legend'];
    expect(levels(play(true, 5), 18)).toEqual([...order, ...order]);
  });

  it('mixes the difficulties with Easiest first off', () => {
    const easiestFirst = levels(play(true, 1), 9).join();
    const mixed = [1, 2, 3, 4, 5].map((seed) => levels(play(false, seed), 9));
    expect(mixed.every((seen) => seen.join() !== easiestFirst)).toBe(true);
    expect(mixed.every((seen) => [...seen].sort().join() === easiestFirst.split(',').sort().join())).toBe(true);
  });
});

describe('Home Quick Play', () => {
  it('plays Zen with all specialties at Normal, Tricky and Hard in UnspokenMD', () => {
    const settings = homeQuickPlaySettings(mdGameConfig);
    expect(settings).toMatchObject({ mode: 'zen', difficulties: ['Normal', 'Tricky', 'Hard'], specialties: [], categories: [] });
    expect(isHomeQuickPlay(settings, mdGameConfig)).toBe(true);
  });

  it('plays Endless with all cards at Normal, Tricky and Hard in Unspoken', () => {
    const settings = homeQuickPlaySettings(extendedGameConfig);
    expect(settings).toMatchObject({ mode: 'endless', difficulties: ['Normal', 'Tricky', 'Hard'], categories: [] });
  });

  it('carries on only with a game playing exactly that', () => {
    const quick = homeQuickPlaySettings(mdGameConfig);
    expect(isHomeQuickPlay({ ...quick, difficulties: ['Hard', 'Normal', 'Tricky'] }, mdGameConfig)).toBe(true);
    expect(isHomeQuickPlay({ ...quick, difficulties: ['Tricky'] }, mdGameConfig)).toBe(false);
    expect(isHomeQuickPlay({ ...quick, specialties: ['renal'] }, mdGameConfig)).toBe(false);
    expect(isHomeQuickPlay({ ...quick, mode: 'ladder' }, mdGameConfig)).toBe(false);
    expect(isHomeQuickPlay(deepDiveSettings('renal', false, mdGameConfig), mdGameConfig)).toBe(false);
  });
});

describe('difficultySpan', () => {
  const chip = (list: Difficulty[]) => difficultySpan(list, { names: badges, span: '{easiest}–{hardest}', mixed: '{easiest}+' }, mdGameConfig, mdGameConfig.badgeMaxChars);
  const line = (list: Difficulty[]) => difficultySpan(list, { names, span: '{easiest} to {hardest}', mixed: '{easiest}+' }, mdGameConfig);

  it('names a run of difficulties from the easiest to the hardest', () => {
    expect(chip(['Hard', 'Normal', 'Tricky'])).toBe('NORMAL–HARD');
    expect(line(['Normal', 'Tricky', 'Hard', 'Tough', 'Expert', 'Elite', 'Master', 'Legend'])).toBe('Normal to Legend');
  });

  it('names one difficulty alone', () => {
    expect(chip(['Tricky'])).toBe('TRICKY');
  });

  it('falls back to the easiest and + for a gap, or a span too long for the chip', () => {
    expect(chip(['Normal', 'Hard'])).toBe('NORMAL+');
    expect(chip(['Normal', 'Tricky', 'Hard', 'Tough', 'Expert', 'Elite', 'Master', 'Legend'])).toBe('NORMAL+');
  });
});
