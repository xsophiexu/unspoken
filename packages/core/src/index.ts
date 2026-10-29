// @unspoken/core: the game domain. Pure TypeScript with no React, platform or network APIs, so the
// same rules run in the Expo app, the Next.js site and the service.

export * from './types';
export * from './config';
export * from './rules';
export * from './random';
export * from './bank';
export * from './text';
export * from './fit';
export * from './present';
export * from './feedback';
export * from './spotlight';
export * from './edition';
export * from './chips';
export * from './search';

export { advance, currentCard, newDeck, showNow, type DeckState } from './round/deck';
export * from './round/swipe';
export * from './round/reverse';
export * from './round/mindReader';
export * from './round/versus';
export * from './versus/match';
export * from './mindReader/lineup';
export * from './mindReader/match';
export * from './round';
