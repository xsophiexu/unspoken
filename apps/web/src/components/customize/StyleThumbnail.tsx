'use client';

import { bank } from '@unspoken/content';
import { cardsFor, createRound, defaultSettings, gameConfig, type SwipeRoundState } from '@unspoken/core';
import { layoutStyles, resolveTheme, type ColorMode, type StyleId } from '@unspoken/design-tokens';

import { swipeModel, type PlayModel } from '@/components/play/model';
import { PlayFrame } from '@/components/play/PlayFrame';

import styles from './StyleThumbnail.module.css';

// Any fixed seed: every visit deals the same sample card.
const PREVIEW_SEED = 1;

let sample: PlayModel | undefined;

// The sample round: the first timed swipe mode, so every slot (the clock too) has something to show.
function sampleModel(): PlayModel {
  if (sample) return sample;
  const mode = gameConfig.modes.find((m) => m.available && m.play === 'swipe' && m.clock === 'visible');
  const settings = { ...defaultSettings(), mode: mode?.id ?? gameConfig.defaults.mode };
  const round = createRound(settings, { cards: cardsFor(bank, settings.difficulty, settings.categories), seed: PREVIEW_SEED });
  sample = swipeModel(round as SwipeRoundState);
  return sample;
}

// A style on Customize: the real play screen at the reference size, scaled down (layout.thumbnail),
// in the style's thumbnail color (or its pinned color) and the current light or dark mode.
export function StyleThumbnail({ style, mode }: { style: StyleId; mode: ColorMode }) {
  const layoutStyle = layoutStyles[style];
  const color = resolveTheme({ style, color: layoutStyle.thumbnailColor, mode }).color;
  return (
    <span className={styles.thumb} aria-hidden="true">
      <span className={styles.screen} data-color={color} data-mode={mode} inert>
        <PlayFrame layoutStyle={layoutStyle} model={sampleModel()} />
      </span>
    </span>
  );
}
