import { CATEGORY_IDS, DIFFICULTY_IDS, LEGACY_DIFFICULTIES, cardsFor, categoriesInBank, dealFromBank, normalizeBank, type BankCardInput } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import raw from '../data/word-banks.json';
import { bank } from '../src';

// Checks on the shipped word bank, so a bad edit to data/word-banks.json fails before it ships.
describe('shipped word bank', () => {
  it('gives every card ten banned words, strongest first, with no blanks', () => {
    const bad = bank.filter((c) => c.banned.length !== 10 || c.banned.some((b) => !b.trim()));
    expect(bad.map((c) => c.word)).toEqual([]);
  });

  it('gives every card a unique id', () => {
    expect(new Set(bank.map((c) => c.id)).size).toBe(bank.length);
  });

  it('tags every card with at least one known theme', () => {
    const known = new Set<string>(CATEGORY_IDS);
    const bad = bank.filter((c) => c.categories.length === 0 || c.categories.some((t) => !known.has(t)));
    expect(bad.map((c) => c.word)).toEqual([]);
  });

  it('has an All cards deck of at least 20 cards at every difficulty', () => {
    for (const difficulty of DIFFICULTY_IDS) expect(cardsFor(bank, difficulty, []).length).toBeGreaterThanOrEqual(20);
  });

  it('covers every theme the setup screen lists', () => {
    expect(categoriesInBank(bank)).toEqual([...CATEGORY_IDS]);
  });

  it('levels every card by its score with the current level names', () => {
    const counts = Object.fromEntries(DIFFICULTY_IDS.map((d) => [d, bank.filter((c) => c.difficulty === d).length]));
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(bank.length);
    // Each score lands on its own level: 4 is Hard, 9 and 10 are Legend.
    const scored = raw as BankCardInput[];
    const hard = scored.filter((c) => c.score === 4).map((c) => c.word);
    const legend = scored.filter((c) => c.score! >= 9).map((c) => c.word);
    expect(bank.filter((c) => c.difficulty === 'Hard').map((c) => c.word)).toEqual(hard);
    expect(bank.filter((c) => c.difficulty === 'Legend').map((c) => c.word)).toEqual(legend);
  });

  it('loads the same bank once the file carries the new level names', () => {
    const renamed = (raw as BankCardInput[]).map((c) => ({ ...c, difficulty: c.difficulty && (LEGACY_DIFFICULTIES[c.difficulty as keyof typeof LEGACY_DIFFICULTIES] ?? c.difficulty) }));
    expect(renamed.some((c) => c.difficulty === 'Legend')).toBe(true);
    expect(normalizeBank(renamed)).toEqual(bank);
  });

  it('loads the same bank from difficulty names alone, old or new, if scores go missing', () => {
    const unscored = (raw as BankCardInput[]).map(({ score: _score, ...c }) => c);
    expect(normalizeBank(unscored)).toEqual(bank);
  });

  it('deals a full Escalate deck at the default level', () => {
    const dealt = dealFromBank(bank, { difficulty: 'Hard', categories: [], mode: 'escalate', seed: 1, count: 30 });
    expect(dealt.cards).toHaveLength(30);
  });
});
