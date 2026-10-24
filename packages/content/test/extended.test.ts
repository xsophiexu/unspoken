import { ALL_DIFFICULTY_IDS, CATEGORY_IDS, dealFromBank, type Card, type Category } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import easy from '../data/easy.json';
import christmas from '../data/packs/christmas.json';
import halloween from '../data/packs/halloween.json';
import thanksgiving from '../data/packs/thanksgiving.json';
import raw from '../data/word-banks.json';
import { bank, extendedBank } from '../src';

// The website's bank: the free bank plus the seasonal packs (Halloween, Thanksgiving, Christmas)
// and the Easy cards. Expected words come straight from the data files.

const everyLevel = [...ALL_DIFFICULTY_IDS];
const words = (cards: readonly Card[]) => cards.map((c) => c.word).sort();
const lower = (list: readonly string[]) => new Set(list.map((w) => w.toLowerCase()));
const freeWords = lower(raw.map((c) => c.word));
const seasonal = new Set<Category>(['Halloween', 'Thanksgiving', 'Christmas']);
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

describe.each([
  { pack: thanksgiving, tagged: 5, packOnly: 40 },
  { pack: christmas, tagged: 4, packOnly: 67 },
])('$pack.category on the website', ({ pack, tagged, packOnly: packOnlyCount }) => {
  const category = pack.category as Category;
  const ownCards = pack.cards.map((c) => c.word).filter((w) => !freeWords.has(w.toLowerCase()));

  it('deals every pack card and the tagged free bank words, and nothing else, when only it is picked', () => {
    const expected = [...new Set([...pack.cards.map((c) => c.word), ...pack.freeBankWords])].sort();
    expect(pack.freeBankWords).toHaveLength(tagged);
    expect(words(deal(everyLevel, [category]))).toEqual(expected);
  });

  it('never deals the pack’s own cards in All cards', () => {
    const all = lower(words(deal(everyLevel, [])));
    expect(ownCards).toHaveLength(packOnlyCount);
    expect(ownCards.filter((w) => all.has(w.toLowerCase()))).toEqual([]);
  });

  it('keeps the tagged words, and pack words the free bank has, in their free bank categories too', () => {
    const shared = [...pack.freeBankWords, ...pack.cards.map((c) => c.word).filter((w) => freeWords.has(w.toLowerCase()))];
    const missing = shared.filter((word) => {
      const card = raw.find((c) => c.word.toLowerCase() === word.toLowerCase())!;
      return !words(deal(everyLevel, card.themes as Category[])).includes(card.word);
    });
    expect(missing).toEqual([]);
  });

  it('puts score 1 cards at Easy', () => {
    const scoreOne = pack.cards.filter((c) => c.score === 1).map((c) => c.word).sort();
    expect(scoreOne.length).toBeGreaterThan(0);
    expect(words(deal(['Easy'], [category]))).toEqual(scoreOne);
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
  it('stays the free bank: same cards, no Easy cards, no seasonal categories', () => {
    expect(bank.map((c) => c.word)).toEqual(raw.map((c) => c.word));
    expect(bank.filter((c) => c.difficulty === 'Easy' || c.categories.some((t) => seasonal.has(t)))).toEqual([]);
  });

  it('keeps every free bank card as it is in the website’s bank, apart from the seasonal tags', () => {
    const website = new Map(extendedBank.map((c) => [c.id, c]));
    const changed = bank.filter((c) => {
      const w = website.get(c.id);
      return !w || w.word !== c.word || w.difficulty !== c.difficulty || w.inAll !== c.inAll || w.categories.filter((t) => !seasonal.has(t)).join() !== c.categories.join();
    });
    expect(changed).toEqual([]);
  });
});
