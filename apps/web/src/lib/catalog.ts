import { extendedBank } from '@unspoken/content';
import { extendedGameConfig, type Difficulty } from '@unspoken/core';

// What the website plays: the extended catalog, with Easy before Normal and the seasonal
// categories (Halloween, Thanksgiving, Christmas) after the others, and the bank with their cards. The Android app stays on
// gameConfig and the plain bank. Pass `config` to core helpers that look at difficulties or
// categories.
export const config = extendedGameConfig;
export const bank = extendedBank;

// The levels the pickers show, easiest first.
export const difficultyIds: readonly Difficulty[] = config.difficulties.map((d) => d.id);
