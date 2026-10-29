'use client';

import { cardsFor, createRound, defaultSettings, type SwipeRoundState } from '@unspoken/core';
import { layoutStyleFor, modeFor, resolveTheme, type ColorMode, type PaletteId, type StyleId } from '@unspoken/design-tokens';

import { swipeModel, type PlayModel } from '@/components/play/model';
import { PlayFrame } from '@/components/play/PlayFrame';
import { bank, config } from '@/lib/catalog';

import styles from './StyleThumbnail.module.css';

// Any fixed seed, and the same sample card as the Android thumbnails.
const PREVIEW_SEED = 1;
const PREVIEW_CARD_ID = 'road-trip';

let sample: PlayModel | undefined;

// The sample round: the first timed swipe mode, so every slot (the clock too) has something to show.
function sampleModel(): PlayModel {
  if (sample) return sample;
  const mode = config.modes.find((m) => m.available && m.play === 'swipe' && m.clock === 'visible');
  const settings = { ...defaultSettings(config), mode: mode?.id ?? config.defaults.mode };
  const card = bank.find((c) => c.id === PREVIEW_CARD_ID);
  const cards = card ? [{ id: card.id, word: card.word, banned: card.banned }] : cardsFor(bank, settings.difficulties, settings.categories);
  const round = createRound(settings, { cards, seed: PREVIEW_SEED, config });
  sample = swipeModel(round as SwipeRoundState);
  return sample;
}

// A style on Customize: the real play screen at the reference size, scaled down (layout.thumbnail),
// in the style's thumbnail color (or its pinned color) and the current light or dark mode (or the
// style's own, for the always-dark Halloween looks). An edition with its own palette (UnspokenMD)
// shows every style in it.
export function StyleThumbnail({ style, mode: picked, palette }: { style: StyleId; mode: ColorMode; palette?: PaletteId }) {
  const mode = modeFor({ style, mode: picked });
  const layoutStyle = layoutStyleFor(style, mode);
  const color = resolveTheme({ style, color: layoutStyle.thumbnailColor, mode }, palette).color;
  return (
    <span className={styles.thumb} aria-hidden="true">
      <span className={styles.screen} data-color={color} data-mode={mode} inert>
        <PlayFrame layoutStyle={layoutStyle} model={sampleModel()} />
      </span>
    </span>
  );
}
