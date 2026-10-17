import { normalizeBank, type BankCardInput, type BankEntry } from '@unspoken/core';

import raw from '../data/word-banks.json';

// @unspoken/content: the data every platform and the service load.

// The word bank, copied from /mnt/project-files/unspoken/word-banks.json (written in the "Harder
// difficulty word samples" thread). Add cards in data/word-banks.json. Every card has 10 banned
// words, strongest first, and some cards sit in two themes. Each card's level comes from its score,
// so the file may still carry the old level names. Ready for cardsFor, deckSize,
// categoriesInBank and dealFromBank from @unspoken/core.
export const bank: readonly BankEntry[] = normalizeBank(raw as BankCardInput[]);

// The copy catalog: every user-facing string, in English. A new locale is a copy of en.ts typed as
// CopyCatalog.
export * from './en';
