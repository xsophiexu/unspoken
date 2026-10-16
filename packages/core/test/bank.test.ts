import { describe, expect, it } from 'vitest';

import { cardsFor, categoriesInBank, dealFromBank, deckSize, normalizeBank, playableCards, type BankCardInput } from '../src';
import { makeCards } from './fixtures';

const ten = (w: string) => Array.from({ length: 10 }, (_, i) => `${w}${i}`);

const raw: BankCardInput[] = [
  { word: 'Hangover', banned: ten('Drink'), difficulty: 'Expert 1', themes: ['Everyday Life'], allCards: true, allCardsWeight: 0.04 },
  { word: 'Freddie Mercury', banned: ten('Queen'), difficulty: 'Expert 1', themes: ['Pop Culture'], allCards: false, allCardsWeight: 0 },
  { word: 'Placebo', banned: ten('Pill'), difficulty: 'Expert 1', themes: ['Health and Body', 'Science and Nature'], allCards: true, allCardsWeight: 0.01 },
  { word: 'Unweighted', banned: ten('X'), difficulty: 'Expert 1', theme: 'Society' },
  { word: 'Zero weight', banned: ten('Y'), difficulty: 'Expert 1', themes: ['Society'], allCardsWeight: 0 },
  { word: 'Nightmare', banned: ['dream', 'iPhone', 'Scary'], difficulty: 'Normal', themes: ['Inner World'] },
];
const bank = normalizeBank(raw);
const words = (cards: { word: string }[]) => cards.map((c) => c.word).sort();

describe('normalizeBank', () => {
  it('capitalizes lowercase banned words but leaves names like iPhone alone', () => {
    const nightmare = bank.find((c) => c.word === 'Nightmare')!;
    expect(nightmare.banned).toEqual(['Dream', 'iPhone', 'Scary']);
  });

  it('gives every card a stable URL-safe id from its word', () => {
    expect(bank.map((c) => c.id)).toContain('freddie-mercury');
    expect(normalizeBank([{ word: 'Café au lait', banned: [], difficulty: 'Normal' }])[0]!.id).toBe('cafe-au-lait');
  });

  it('keeps ids unique when two words differ only by accents', () => {
    const ids = normalizeBank([
      { word: 'Ragnarok', banned: [], difficulty: 'Expert 2' },
      { word: 'Ragnarök', banned: [], difficulty: 'Master 1' },
      { word: 'Ragnarök', banned: [], difficulty: 'Master 1' },
    ]).map((c) => c.id);
    expect(ids[0]).toBe('ragnarok');
    expect(new Set(ids).size).toBe(3);
  });
});

describe('cardsFor', () => {
  it('All cards leaves out cards kept out of All cards and cards with no weight', () => {
    expect(words(cardsFor(bank, 'Expert 1', []))).toEqual(['Hangover', 'Placebo', 'Unweighted']);
  });

  it('All cards carries each card’s balancing weight (1 when the bank gives none)', () => {
    const weights = Object.fromEntries(cardsFor(bank, 'Expert 1', []).map((c) => [c.word, c.weight]));
    expect(weights).toEqual({ Hangover: 0.04, Placebo: 0.01, Unweighted: 1 });
  });

  it('chosen themes include names and jargon, unweighted', () => {
    const pop = cardsFor(bank, 'Expert 1', ['Pop Culture']);
    expect(words(pop)).toEqual(['Freddie Mercury']);
    expect(pop[0]!.weight).toBeUndefined();
  });

  it('matches a card in any of its themes, once, when several themes are chosen', () => {
    expect(words(cardsFor(bank, 'Expert 1', ['Science and Nature']))).toEqual(['Placebo']);
    expect(words(cardsFor(bank, 'Expert 1', ['Science and Nature', 'Health and Body']))).toEqual(['Placebo']);
    expect(words(cardsFor(bank, 'Expert 1', ['Society']))).toEqual(['Unweighted', 'Zero weight']);
  });

  it('only draws from the chosen difficulty', () => {
    expect(words(cardsFor(bank, 'Normal', []))).toEqual(['Nightmare']);
    expect(deckSize(bank, 'Grandmaster', [])).toBe(0);
  });
});

describe('categoriesInBank', () => {
  it('lists only themes that have cards, in catalog order', () => {
    expect(categoriesInBank(bank)).toEqual(['Inner World', 'Pop Culture', 'Science and Nature', 'Health and Body', 'Society', 'Everyday Life']);
  });
});

describe('playableCards', () => {
  it('Escalate plays only cards with all ten banned words when there are enough', () => {
    const cards = [...makeCards(20, 10), ...makeCards(5, 6).map((c) => ({ ...c, id: `short-${c.id}` }))];
    const played = playableCards('escalate', cards);
    expect(played).toHaveLength(20);
    expect(played.every((c) => c.banned.length === 10)).toBe(true);
  });

  it('Escalate falls back to every card while fewer than 20 have ten banned words', () => {
    const cards = [...makeCards(19, 10), ...makeCards(5, 6).map((c) => ({ ...c, id: `short-${c.id}` }))];
    expect(playableCards('escalate', cards)).toHaveLength(24);
  });

  it('other modes play every card', () => {
    const cards = makeCards(5, 6);
    expect(playableCards('classic', cards)).toHaveLength(5);
  });
});

describe('dealFromBank', () => {
  const big = normalizeBank(
    Array.from({ length: 50 }, (_, i) => ({
      word: `Card ${i}`,
      banned: ten(`B${i}-`).slice(0, i % 2 === 0 ? 10 : 6),
      difficulty: 'Expert 1' as const,
      themes: [i < 40 ? ('Society' as const) : ('Pop Culture' as const)],
      allCards: i < 45,
    })),
  );

  it('deals the same cards for the same seed and request', () => {
    const a = dealFromBank(big, { difficulty: 'Expert 1', categories: [], seed: 99, count: 10 });
    const b = dealFromBank(big, { difficulty: 'Expert 1', categories: [], seed: 99, count: 10 });
    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
    expect(dealFromBank(big, { difficulty: 'Expert 1', categories: [], seed: 100, count: 10 }).cards).not.toEqual(a.cards);
  });

  it('returns the requested number of cards and the size of the pool they came from', () => {
    const dealt = dealFromBank(big, { difficulty: 'Expert 1', categories: [], seed: 1, count: 12 });
    expect(dealt.cards).toHaveLength(12);
    expect(dealt.total).toBe(45);
  });

  it('returns the whole shuffled pool without a count, never repeating a card', () => {
    const dealt = dealFromBank(big, { difficulty: 'Expert 1', categories: ['Pop Culture'], seed: 1 });
    expect(dealt.cards).toHaveLength(10);
    expect(new Set(dealt.cards.map((c) => c.id)).size).toBe(10);
  });

  it('never deals cards kept out of All cards when no theme is chosen', () => {
    const dealt = dealFromBank(big, { difficulty: 'Expert 1', categories: [], seed: 5 });
    expect(dealt.cards.some((c) => ['Card 45', 'Card 46', 'Card 47', 'Card 48', 'Card 49'].includes(c.word))).toBe(false);
  });

  it('deals only full cards for Escalate when there are enough', () => {
    const dealt = dealFromBank(big, { difficulty: 'Expert 1', categories: [], mode: 'escalate', seed: 5 });
    expect(dealt.cards.every((c) => c.banned.length === 10)).toBe(true);
  });
});
