import { normalizeBank, type BankCardInput, type BankEntry, type Category } from '@unspoken/core';

import easyRaw from '../data/easy.json';
import christmas from '../data/packs/christmas.json';
import halloween from '../data/packs/halloween.json';
import medical from '../data/packs/medical.json';
import thanksgiving from '../data/packs/thanksgiving.json';
import raw from '../data/word-banks.json';

// @unspoken/content: the data every platform and the service load.

// The word bank, copied from /mnt/project-files/unspoken/word-banks.json (written in the "Harder
// difficulty word samples" thread). Add cards in data/word-banks.json. Every card has 10 banned
// words, strongest first, and some cards sit in two themes. Each card's level comes from its score,
// so the file may still carry the old level names. Ready for cardsFor, deckSize,
// categoriesInBank and dealFromBank from @unspoken/core.
export const bank: readonly BankEntry[] = normalizeBank(raw as BankCardInput[]);

// A seasonal category pack: its own cards, and words already in the bank that belong to it too.
export type CategoryPack = {
  category: Category;
  cards: readonly Pick<BankCardInput, 'word' | 'banned' | 'score'>[];
  freeBankWords: readonly string[];
};

// The bank with packs and extra cards added, for an app that offers the extra categories and levels
// (extendedGameConfig). Bank cards keep their ids, categories and place in All cards; a pack's words
// also join its category, and a pack card whose word the bank already has does too (the bank's
// card wins). The rest of a pack's cards play only in its category, never in All cards. Extra
// cards are added as they are.
export function extendBank(base: readonly BankCardInput[], packs: readonly CategoryPack[], extra: readonly BankCardInput[]): BankEntry[] {
  const key = (word: string) => word.toLowerCase();
  const known = new Set(base.map((c) => key(c.word)));
  const joins = new Map<string, Category[]>();
  for (const pack of packs) {
    for (const word of [...pack.freeBankWords, ...pack.cards.map((c) => c.word)]) {
      if (known.has(key(word))) joins.set(key(word), [...(joins.get(key(word)) ?? []), pack.category]);
    }
  }
  const tagged = base.map((card) => {
    const more = joins.get(key(card.word));
    if (!more) return card;
    const themes = card.themes ?? (card.theme ? [card.theme] : []);
    return { ...card, themes: [...new Set([...themes, ...more])] };
  });
  const packCards = packs.flatMap((pack) =>
    pack.cards.filter((c) => !known.has(key(c.word))).map((c): BankCardInput => ({ ...c, themes: [pack.category], allCards: false })),
  );
  return normalizeBank([...tagged, ...packCards, ...extra]);
}

// The website's bank: the bank plus the seasonal packs (data/packs/halloween.json,
// thanksgiving.json and christmas.json, from holidays-and-seasons.json and its free tags) and the Easy cards (data/easy.json: the score 1
// cards of the newer word bank, filed under today's categories). The Android app plays `bank`.
export const extendedBank: readonly BankEntry[] = extendBank(
  raw as BankCardInput[],
  // Medical (Hot Mic experiment): the Step 1 jargon cards, rated by students.
  [halloween, thanksgiving, christmas, medical] as CategoryPack[],
  easyRaw as BankCardInput[],
);

// The copy catalog: every user-facing string, in English. A new locale is a copy of en.ts typed as
// CopyCatalog.
export * from './en';

// What each Mind Reader screen says, from the round state.
export * from './mindReader';

// What each Versus screen says, from the round state.
export * from './versus';
