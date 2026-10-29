import {
  DIFFICULTY_IDS,
  SPECIALTY_IDS,
  cardsForSettings,
  createRound,
  defaultSettings,
  mdGameConfig,
  menuStatus,
  roundReducer,
  roundSubline,
  searchCards,
  type RoundAction,
  type RoundState,
} from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { parseMdCards, specialtyId } from '../scripts/md-cards';
import { mdBank, mdEn, mdRoundCopy, mdSpecialties } from '../src';

// Whole words of a phrase, lowercase and without accents.
const wordsOf = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
// Words that join others rather than name anything ("Infant of diabetic mother" may ban a term
// with "of" in it).
const JOINING_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'in', 'on', 'to', 'with', 'for', 'by']);

// Cards in the Words thread's file that ban a word of the card itself, reported to that thread and
// left as written. Remove a card here once the file is fixed.
const KNOWN_REPEATS: string[] = [];

describe('the MD bank', () => {
  it('has 1,021 cards at the card file’s difficulty counts, with no Easy cards', () => {
    const counts = Object.fromEntries(DIFFICULTY_IDS.map((d) => [d, mdBank.filter((c) => c.difficulty === d).length]));
    expect(counts).toEqual({ Normal: 42, Tricky: 76, Hard: 63, Tough: 84, Expert: 108, Elite: 184, Master: 124, Legend: 340 });
    expect(mdBank).toHaveLength(1021);
  });

  it('gives every card 6 banned terms, none blank or repeated', () => {
    const bad = mdBank.filter((c) => c.banned.length !== 6 || c.banned.some((b) => !b.trim()) || new Set(c.banned).size !== 6);
    expect(bad.map((c) => c.word)).toEqual([]);
  });

  it('bans no word that is part of the card word, apart from the cards reported to the Words thread', () => {
    const repeats = mdBank.flatMap((c) => {
      const own = new Set(wordsOf(c.word).filter((w) => !JOINING_WORDS.has(w)));
      return c.banned.filter((b) => wordsOf(b).some((w) => own.has(w))).map((b) => `${c.word} (${b})`);
    });
    expect(repeats).toEqual(KNOWN_REPEATS);
  });

  it('files every card under a known specialty and gives it a unique id', () => {
    expect(mdBank.filter((c) => !c.specialty || !SPECIALTY_IDS.includes(c.specialty)).map((c) => c.word)).toEqual([]);
    expect(new Set(mdBank.map((c) => c.id)).size).toBe(mdBank.length);
  });

  it('keeps jargon that starts lowercase as the file writes it', () => {
    const banned = new Set(mdBank.flatMap((c) => c.banned));
    for (const term of ['p-ANCA', 'c-ANCA', 'hCG', 'p53', 't(9;22)', '45,XO']) expect(banned).toContain(term);
  });
});

describe('MD specialties', () => {
  it('lists the 13 First Aid systems in the file’s order, with their card counts', () => {
    expect(mdSpecialties.map((s) => [s.name, s.cards])).toEqual([
      ['Cardiovascular', 108],
      ['Respiratory', 58],
      ['Gastrointestinal', 95],
      ['Renal', 55],
      ['Endocrine', 57],
      ['Reproductive', 126],
      ['Neurology', 98],
      ['Psychiatry', 58],
      ['Hematology and Oncology', 72],
      ['Musculoskeletal and Skin', 89],
      ['Immunology', 36],
      ['Infectious disease', 106],
      ['Biochemistry and Genetics', 63],
    ]);
  });

  it('names each specialty by the heading the build script reads its id from', () => {
    expect(mdSpecialties.every((s) => specialtyId(s.name) === s.id)).toBe(true);
  });

  it('gives every specialty its own short name for the game’s chip, never longer than the full one', () => {
    const short = SPECIALTY_IDS.map((id) => mdEn.specialtyShort[id]);
    expect(short.every(Boolean)).toBe(true);
    expect(new Set(short).size).toBe(SPECIALTY_IDS.length);
    expect(SPECIALTY_IDS.every((id) => mdEn.specialtyShort[id].length <= mdEn.specialties[id].length)).toBe(true);
  });
});

describe('the MD card script', () => {
  const file = [
    '# Step 1 jargon cards',
    '',
    '| Difficulty | Cards |',
    '|---|---|',
    '| Normal | 2 |',
    '',
    '## Hematology and Oncology',
    '',
    '| Card | Difficulty | Banned |',
    '|---|---|---|',
    '| Anemia | Normal | Hemoglobin, Iron, Pallor, Ferritin, MCV, Transfusion |',
    '',
    '## Reproductive',
    '',
    '| Card | Difficulty | Banned |',
    '|---|---|---|',
    '| Turner syndrome | Expert | 45,XO, Cystic hygroma, Streak ovaries, Coarctation, Bicuspid aortic valve, Lymphedema |',
  ].join('\n');

  it('reads each card under its heading, skipping the counts table', () => {
    const { headings, cards } = parseMdCards(file);
    expect(headings).toEqual(['Hematology and Oncology', 'Reproductive']);
    expect(cards.map((c) => [c.word, c.difficulty, c.specialty])).toEqual([
      ['Anemia', 'Normal', 'hematologyOncology'],
      ['Turner syndrome', 'Expert', 'reproductive'],
    ]);
  });

  it('splits banned terms at a comma and space, keeping 45,XO whole', () => {
    expect(parseMdCards(file).cards[1]!.banned).toEqual(['45,XO', 'Cystic hygroma', 'Streak ovaries', 'Coarctation', 'Bicuspid aortic valve', 'Lymphedema']);
  });
});

describe('playing UnspokenMD with the shipped bank', () => {
  const settings = defaultSettings(mdGameConfig);
  const start = (): RoundState =>
    createRound(settings, { cards: cardsForSettings(mdBank, settings, mdGameConfig), seed: 1, config: mdGameConfig, showIntro: false });
  const play = (state: RoundState, actions: RoundAction[]) => actions.reduce(roundReducer, state);

  it('deals the default Zen game from the 76 Tricky cards', () => {
    expect(cardsForSettings(mdBank, settings, mdGameConfig)).toHaveLength(76);
  });

  it('reads the header and the paused sheet like the Quick Play design', () => {
    const state = play(start(), [{ type: 'correct' }, { type: 'correct' }, { type: 'skip' }]);
    expect(roundSubline(state, mdRoundCopy)).toBe('2 correct · 1 skipped');
    expect(menuStatus(state, mdRoundCopy)).toBe('2 correct · 1 skipped · All specialties');
  });

  it('names one picked specialty, or counts several, on the paused sheet', () => {
    const one = { ...settings, specialties: ['respiratory' as const] };
    const several = { ...settings, specialties: ['respiratory' as const, 'renal' as const] };
    const at = (s: typeof settings) => createRound(s, { cards: cardsForSettings(mdBank, s, mdGameConfig), seed: 1, config: mdGameConfig });
    expect(menuStatus(at(one), mdRoundCopy)).toBe('0 correct · 0 skipped · Respiratory');
    expect(menuStatus(at(several), mdRoundCopy)).toBe('0 correct · 0 skipped · 2 specialties');
  });

  it('counts Ladder’s climb in banned terms', () => {
    const ladder = { ...settings, mode: 'ladder' as const };
    const state = play(createRound(ladder, { cards: cardsForSettings(mdBank, ladder, mdGameConfig), seed: 1, config: mdGameConfig }), [{ type: 'correct' }]);
    expect(roundSubline(state, mdRoundCopy)).toBe('4 banned terms · 3 skips left');
  });

  it('finds a card at any difficulty in search, with its specialty name', () => {
    const results = searchCards(mdBank, 'pneumothorax', mdGameConfig);
    expect(results.length).toBeGreaterThan(0);
    const [first] = results;
    expect(first!.word).toBe('Pneumothorax');
    expect(mdEn.specialties[first!.specialty!]).toBe('Respiratory');
  });
});

describe('MD mode copy', () => {
  it('describes Zen, Versus and Ladder as the MD modes sheet does', () => {
    expect(mdEn.modes).toEqual({
      zen: { name: 'Zen', sub: 'Explain at your own pace. Add a timer or skip limit if you want.' },
      versus: { name: 'Versus', sub: 'Teams or free-for-all. Points per term.' },
      ladder: { name: 'Ladder', sub: 'Get one right, and a new banned term joins.' },
    });
  });
});
