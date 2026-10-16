import { bank } from '@unspoken/content';
import { CATEGORY_IDS, type Card } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { failure, testApp } from './fixtures';

const byId = new Map(bank.map((entry) => [entry.id, entry]));
const entriesOf = (cards: readonly Card[]) => cards.map((card) => byId.get(card.id)!);

// Cards for names, events and jargon: playable in their themes, never in All cards.
const keptOut = bank.filter((entry) => entry.difficulty === 'Master 1' && !entry.inAll);

describe('POST /v1/decks', () => {
  const { api } = testApp();

  it('deals All cards from the requested difficulty without the cards kept out of it', async () => {
    expect(keptOut.length).toBeGreaterThan(0);
    const deck = await api.dealDeck({ difficulty: 'Master 1', seed: 11 });

    expect(deck.cards.length).toBeGreaterThan(100);
    expect(deck.cards).toHaveLength(deck.total);
    expect(new Set(entriesOf(deck.cards).map((e) => e.difficulty))).toEqual(new Set(['Master 1']));
    const dealt = new Set(deck.cards.map((c) => c.id));
    expect(keptOut.filter((entry) => dealt.has(entry.id))).toEqual([]);
  });

  it('deals only the chosen themes, without repeats, including cards kept out of All cards', async () => {
    const card = keptOut[0]!;
    const themes = [...card.categories, CATEGORY_IDS.find((t) => !card.categories.includes(t))!];
    const deck = await api.dealDeck({ difficulty: 'Master 1', categories: themes, seed: 3 });

    expect(deck.cards.map((c) => c.id)).toContain(card.id);
    expect(new Set(deck.cards.map((c) => c.id)).size).toBe(deck.cards.length);
    for (const entry of entriesOf(deck.cards)) {
      expect(entry.difficulty).toBe('Master 1');
      expect(entry.categories.some((t) => themes.includes(t))).toBe(true);
    }
    const themesDealt = new Set(entriesOf(deck.cards).flatMap((e) => e.categories));
    for (const theme of themes) expect(themesDealt).toContain(theme);
  });

  it('returns the first count cards of the same deal, with the total it was drawn from', async () => {
    const full = await api.dealDeck({ difficulty: 'Harder', categories: ['Everyday Life'], seed: 5 });
    const some = await api.dealDeck({ difficulty: 'Harder', categories: ['Everyday Life'], seed: 5, count: 12 });

    expect(some).toEqual({ seed: 5, total: full.total, cards: full.cards.slice(0, 12) });
    expect(full.total).toBeGreaterThan(12);
  });

  it('picks a seed when none is sent, and the same seed deals the same deck again', async () => {
    const first = await api.dealDeck({ difficulty: 'Normal', count: 20 });
    const again = await api.dealDeck({ difficulty: 'Normal', count: 20, seed: first.seed });
    const other = await api.dealDeck({ difficulty: 'Normal', count: 20, seed: (first.seed + 1) >>> 0 });

    expect(again).toEqual(first);
    expect(other.cards).not.toEqual(first.cards);
  });
});

describe('POST /v1/decks with a bad request', () => {
  const { post } = testApp();

  it.each([
    [{ difficulty: 'Impossible' }, ['difficulty']],
    [{ difficulty: 'Normal', categories: ['Cooking'] }, ['categories', 0]],
    [{ difficulty: 'Normal', count: 0 }, ['count']],
    [{ difficulty: 'Normal', count: 1001 }, ['count']],
    [{ difficulty: 'Normal', seed: -1 }, ['seed']],
    [{}, ['difficulty']],
  ])('rejects %j as invalid_request at %j', async (body, path) => {
    expect(await failure(await post('/v1/decks', body))).toEqual({ status: 400, code: 'invalid_request', paths: [path] });
  });

  it('rejects malformed JSON and a body that is not JSON', async () => {
    expect(await failure(await post('/v1/decks', '{"difficulty": '))).toMatchObject({ status: 400, code: 'invalid_request' });
    const text = await post('/v1/decks', 'difficulty=Normal', { 'content-type': 'text/plain' });
    expect(await failure(text)).toMatchObject({ status: 400, code: 'invalid_request' });
  });
});
