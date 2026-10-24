'use client';

import { seededRandom } from '@unspoken/core';
import { scene, type SceneLook, type SceneSlot } from '@unspoken/design-tokens';
import { useId, useRef, type CSSProperties, type ReactNode } from 'react';

import { useElementSize, useReducedMotion } from '@/lib/hooks';
import { cx } from '@/lib/ui';

import type { ClockModel } from '../model';
import { ClockChip } from '../Timer';
import { candle } from './candle';
import type { LookArt } from './parts';
import styles from './Scene.module.css';

export const looks: Readonly<Record<SceneLook, LookArt>> = { candle };

// The share of time left the art shows: the clock's, or the full (start) picture when the round has
// no time limit or hides its clock.
export function sceneFraction(clock: ClockModel | null): number {
  return clock && !clock.hidden ? clock.progress : 1;
}

type SceneBodyProps = {
  slot: SceneSlot;
  clock: ClockModel | null;
  word: ReactNode;
  banned: ReactNode;
  onPause?: () => void;
  // Customize thumbnails: no ambient motion.
  preview: boolean;
};

// A Halloween timer look between the header and the controls: the word and the banned list in a
// column, the art beside them. The word and list are the frame's (they swipe with the card);
// the art is the timer.
export function SceneBody({ slot, clock, word, banned, onPause, preview }: SceneBodyProps) {
  const art = <SceneArt look={slot.look} clock={clock} onPause={onPause} animate={!preview} />;
  return (
    <div className={cx(styles.scene, styles[slot.layout], slot.align === 'center' && styles.center)} data-look={slot.look}>
      <div className={styles.text}>
        {word}
        {banned}
      </div>
      {art}
    </div>
  );
}

type SceneArtProps = {
  look: SceneLook;
  clock: ClockModel | null;
  onPause?: () => void;
  animate: boolean;
};

// The look's art scaled to fit its area (keeping its shape, placed by the look's alignment), with
// the time pill at the look's spot for the time left.
function SceneArt({ look, clock, onPause, animate }: SceneArtProps) {
  const art = looks[look];
  const { box, align } = art;
  const ref = useRef<HTMLDivElement>(null);
  const area = useElementSize(ref, { width: box.width, height: box.height });
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const scale = Math.max(0, Math.min(area.width / box.width, area.height / box.height));
  const width = box.width * scale;
  const height = box.height * scale;
  const offset = (where: 'start' | 'center' | 'end', room: number) => (where === 'start' ? 0 : where === 'end' ? room : room / 2);
  const f = sceneFraction(clock);
  const spot = art.holder(f);
  const holderStyle = {
    left: (spot.x - box.x) * scale,
    top: (spot.y - box.y) * scale,
    '--holder-shift': spot.anchor === 'start' ? '0%' : spot.anchor === 'center' ? '-50%' : '-100%',
  } as CSSProperties;
  const { Art } = art;

  return (
    <div ref={ref} className={styles.artArea} data-fraction={f.toFixed(3)}>
      <div className={styles.artBox} style={{ width, height, left: offset(align.x, area.width - width), top: offset(align.y, area.height - height) }}>
        <svg className={styles.art} viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} width={width} height={height} aria-hidden="true">
          <Art f={f} out={clock !== null && !clock.hidden && clock.progress <= 0} animate={animate && !reduced} uid={uid} />
        </svg>
        {clock && <ClockChip clock={clock} onPause={onPause} fill="accent" className={styles.holder} style={holderStyle} />}
      </div>
    </div>
  );
}

// The faint stars over a look's page, at the design's spots (seeded, so they never move between
// renders), across the game column. They twinkle unless motion is reduced.
export function Stars({ look }: { look: SceneLook }) {
  const stars = looks[look].stars;
  if (!stars) return null;
  const { random } = seededRandom(stars.seed);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)] as T;
  const dots = Array.from({ length: stars.count }, () => ({
    x: random(),
    y: stars.y0 + random() * (stars.y1 - stars.y0),
    size: pick([2, 2, 3]),
    opacity: pick([0.3, 0.45, 0.6]),
    delay: random(),
  }));
  return (
    <div className={styles.stars} aria-hidden="true">
      {dots.map((d, i) => (
        <i
          key={i}
          className={styles.star}
          style={
            {
              left: `${d.x * 100}%`,
              top: `${(d.y / scene.board.height) * 100}%`,
              width: d.size,
              height: d.size,
              '--star-opacity': d.opacity,
              '--star-delay': d.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
