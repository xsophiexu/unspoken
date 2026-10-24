import { ALL_DIFFICULTY_IDS, CATEGORY_IDS, dealFromBank, type Card, type Category } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import easy from '../data/easy.json';
import halloween from '../data/packs/halloween.json';
import raw from '../data/word-banks.json';
import { bank, extendedBank } from '../src';

// The website's bank: the free bank plus the Halloween pack and the Easy cards. Expected words come
// straight from the data files.

const everyLevel = [...ALL_DIFFICULTY_IDS];
const words = (cards: readonly Card[]) => cards.map((c) => c.word).sort();
const lower = (list: readonly string[]) => new Set(list.map((w) => w.toLowerCase()));
const freeWords = lower(raw.map((c) => c.word));
// Halloween cards that aren't already in the free bank.
const packOnly = halloween.cards.map((c) => c.word).filter((w) => !freeWords.has(w.toLowerCase()));

function deal(difficulties: typeof everyLevel, categories: readonly Category[]) {
  return dealFromBank(extendedBank, { difficulties, categories, seed: 7 }).cards;
}

describe('Halloween on the website', () => {
  it('deals every Halloween card and the tagged free bank words, and nothing else, when only Halloween is picked', () => {
    const expected = [...new Set([...halloween.cards.map((c) => c.word), ...halloween.freeBankWords])].sort();
    expect(halloween.freeBankWords).toHaveLength(18);
    expect(words(deal(everyLevel, ['Halloween']))).toEqual(expected);
  });

  it('never deals the pack’s own cards in All cards', () => {
    const all = lower(words(deal(everyLevel, [])));
    expect(packOnly.length).toBeGreaterThan(0);
    expect(packOnly.filter((w) => all.has(w.toLowerCase()))).toEqual([]);
  });

  it('keeps the tagged words in their free bank categories too', () => {
    const missing = halloween.freeBankWords.filter((word) => {
      const card = raw.find((c) => c.word === word)!;
      return !words(deal(everyLevel, card.themes as Category[])).includes(word);
    });
    expect(missing).toEqual([]);
  });

  it('mixes Halloween with another category', () => {
    const mixed = words(deal(['Normal'], ['Halloween', 'Technology']));
    const halloweenOnly = words(deal(['Normal'], ['Halloween']));
    const technologyOnly = words(deal(['Normal'], ['Technology']));
    expect(mixed).toEqual([...new Set([...halloweenOnly, ...technologyOnly])].sort());
  });

  it('puts score 1 Halloween cards at Easy', () => {
    const scoreOne = halloween.cards.filter((c) => c.score === 1).map((c) => c.word).sort();
    expect(scoreOne).toHaveLength(13);
    expect(words(deal(['Easy'], ['Halloween']))).toEqual(scoreOne);
  });
});

describe('Easy on the website', () => {
  it('deals only the score 1 cards when only Easy is picked', () => {
    expect(words(deal(['Easy'], []))).toEqual(easy.map((c) => c.word).sort());
  });

  it('files the Easy cards under today’s categories', () => {
    const known = new Set<string>(CATEGORY_IDS);
    expect(easy.flatMap((c) => c.themes).filter((t) => !known.has(t))).toEqual([]);
  });
});

describe('the Android app’s bank', () => {
  it('stays the free bank: same cards, no Easy cards, no Halloween', () => {
    expect(bank.map((c) => c.word)).toEqual(raw.map((c) => c.word));
    expect(bank.filter((c) => c.difficulty === 'Easy' || c.categories.includes('Halloween'))).toEqual([]);
  });

  it('keeps every free bank card as it is in the website’s bank, apart from the Halloween tag', () => {
    const website = new Map(extendedBank.map((c) => [c.id, c]));
    const changed = bank.filter((c) => {
      const w = website.get(c.id);
      return !w || w.word !== c.word || w.difficulty !== c.difficulty || w.inAll !== c.inAll || w.categories.filter((t) => t !== 'Halloween').join() !== c.categories.join();
    });
    expect(changed).toEqual([]);
  });
});
