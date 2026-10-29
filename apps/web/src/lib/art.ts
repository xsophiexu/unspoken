import type { CharacterId, EditionId } from '@unspoken/core';

import { config } from './config';

// Pictures served from public/, with their pixel size so the page keeps their shape while loading.

// Home's fox holding the edition's card. UnspokenMD's is the design's unspokenmd-fox-card@3x.png
// (trimmed to the art); Unspoken's is the app icon's art with its background taken out.
export const homeArt: Readonly<Record<EditionId, { src: string; width: number; height: number }>> = {
  unspoken: { src: `${config.basePath}/art/unspoken-fox-card.png`, width: 700, height: 711 },
  md: { src: `${config.basePath}/art/unspokenmd-fox-card.png`, width: 724, height: 789 },
};

// A player character (64 × 64), always drawn bare.
export const characterSrc = (id: CharacterId) => `${config.basePath}/characters/${id}.svg`;
