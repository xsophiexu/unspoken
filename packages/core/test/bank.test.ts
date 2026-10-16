import { describe, expect, it } from 'vitest';

import { cardsFor, categoriesInBank, deckSize, normalizeBank, playableCards, type BankCardInput } from '../src';
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
