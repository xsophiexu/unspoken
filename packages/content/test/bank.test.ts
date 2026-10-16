import { CATEGORY_IDS, DIFFICULTY_IDS, cardsFor, categoriesInBank, dealFromBank } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

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

  it('deals a full Escalate deck at the default level', () => {
    const dealt = dealFromBank(bank, { difficulty: 'Expert 1', categories: [], mode: 'escalate', seed: 1, count: 30 });
    expect(dealt.cards).toHaveLength(30);
  });
});
