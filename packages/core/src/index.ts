// @unspoken/core: the game domain. Pure TypeScript with no React, platform or network APIs, so the
// same rules run in the Expo app, the Next.js site and the service.

export * from './types';
export * from './config';
export * from './rules';
export * from './random';
export * from './deal';
export * from './bank';
export * from './text';
export * from './fit';
export * from './present';
export * from './feedback';

export { advance, currentCard, newDeck, type DeckState } from './round/deck';
export * from './round/swipe';
export * from './round/reverse';
export * from './round/mindReader';
export * from './round';
