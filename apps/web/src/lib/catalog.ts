import { extendedBank, mdBank, mdRoundCopy, roundCopy } from '@unspoken/content';
import {
  cardsForSpecialties,
  deckSize,
  editionConfigs,
  type BankEntry,
  type Category,
  type Difficulty,
  type EditionId,
  type GameConfig,
  type RoundCopy,
  type Specialty,
} from '@unspoken/core';

// What the website plays: the extended catalog, with Easy before Normal and the seasonal
// categories (Halloween, Thanksgiving, Christmas) after the others, and the bank with their cards. The Android app stays on
// gameConfig and the plain bank. Pass `config` to core helpers that look at difficulties or
// categories.
export const config = editionConfigs.unspoken;
export const bank = extendedBank;

// The levels the pickers show, easiest first.
export const difficultyIds: readonly Difficulty[] = config.difficulties.map((d) => d.id);

// One edition's game: its rules, cards, difficulties, the copy its status lines read, and where its
// settings are saved (each edition keeps its own, so switching editions keeps both).
export type Catalog = {
  edition: EditionId;
  config: GameConfig;
  bank: readonly BankEntry[];
  difficultyIds: readonly Difficulty[];
  copy: RoundCopy;
  settingsKey: string;
  // Where it saves how its game was started (Quick Play or New game).
  startKey: string;
};

const md = editionConfigs.md;

export const catalogs: Readonly<Record<EditionId, Catalog>> = {
  unspoken: { edition: 'unspoken', config, bank, difficultyIds, copy: roundCopy, settingsKey: 'unspoken.settings', startKey: 'unspoken.start' },
  md: { edition: 'md', config: md, bank: mdBank, difficultyIds: md.difficulties.map((d) => d.id), copy: mdRoundCopy, settingsKey: 'unspoken.md.settings', startKey: 'unspoken.md.start' },
};

// The catalog a game's config belongs to (every round carries its config).
export function catalogFor(gameConfig: GameConfig): Catalog {
  return catalogs[gameConfig.edition ?? 'unspoken'];
}

// What a game draws from besides its difficulties: categories, or UnspokenMD's specialties.
export type Picks = { categories: readonly Category[]; specialties?: readonly Specialty[] };

// How many cards these difficulties and picks draw from, in the catalog's edition.
export function countCards({ bank, config }: Catalog, difficulties: Difficulty | readonly Difficulty[], picks: Picks): number {
  return config.specialties ? cardsForSpecialties(bank, difficulties, picks.specialties ?? []).length : deckSize(bank, difficulties, picks.categories);
}
