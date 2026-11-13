import type { CharacterId, EditionId } from '@unspoken/core';

import { config } from './config';

// Pictures served from public/, with their pixel size so the page keeps their shape while loading.

// Home's art for each edition. Unspoken's is the fox holding its card (the app icon's art with its
// background taken out); UnspokenMD's is just its card, with no fox (Kurt, 2026-11-13).
export const homeArt: Readonly<Record<EditionId, { src: string; width: number; height: number }>> = {
  unspoken: { src: `${config.basePath}/art/unspoken-fox-card.png`, width: 700, height: 711 },
  md: { src: `${config.basePath}/art/unspokenmd-card.png`, width: 724, height: 526 },
};

// A player character (64 × 64), always drawn bare.
export const characterSrc = (id: CharacterId) => `${config.basePath}/characters/${id}.svg`;
