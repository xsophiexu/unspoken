import { normalizeBank, type BankCardInput, type BankEntry } from '@unspoken/core';

import raw from '../data/word-banks.json';

// The word bank is written in the "Harder difficulty word samples" thread and copied from
// /mnt/project-files/unspoken/word-banks.json. Add cards in data/word-banks.json.
// Every card has 10 banned words, strongest first, and some cards sit in two themes.
export const rawBank: readonly BankCardInput[] = raw as BankCardInput[];

// The bank ready for cardsFor / deckSize / categoriesInBank from @unspoken/core.
export const bank: readonly BankEntry[] = normalizeBank(rawBank);
