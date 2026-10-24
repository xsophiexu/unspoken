import { motion } from '@unspoken/design-tokens';
import type { ReactElement } from 'react';

// What every Halloween look module provides. The art is a pure function of the share of time left
// (f, 1 at the start and 0 when time is up), drawn in the board's coordinates (the 372 × 826 play
// page of the designs, gen62hw.py), so the paths and positions are the design's own numbers.

export type Box = { x: number; y: number; width: number; height: number };

export type ArtProps = {
  // Share of time left, 0 to 1.
  f: number;
  // Time has run out (the candle smokes instead of burning).
  out: boolean;
  // Ambient motion (flicker, flapping, bubbles, sway) on; off under reduced motion and in previews.
  animate: boolean;
  // A prefix for gradient and clip ids, unique on the page (thumbnails draw the same art).
  uid: string;
};

export type LookArt = {
  // The part of the board the art takes; it scales to fit its area keeping this shape.
  box: Box;
  // How the art sits in an area of another shape.
  align: { x: 'start' | 'center' | 'end'; y: 'start' | 'center' | 'end' };
  // Where the time holder sits for a share of time left: board coordinates of its top edge, and
  // which of its edges (or its middle) x names.
  holder: (f: number) => { x: number; y: number; anchor: 'start' | 'center' | 'end' };
  // The faint stars on the page: a seed, how many, and the band of the board they fall in.
  stars?: { seed: number; count: number; y0: number; y1: number };
  Art: (props: ArtProps) => ReactElement;
};

// Durations for SMIL attributes, and the scene's motion tokens.
export const ms = (n: number) => `${n}ms`;
export const sceneMotion = motion.scene;
const m = sceneMotion;

// A bat (the design's path), at board (x, y) and scale s. With motion on its wings flap and it
// drifts up and back; `phase` staggers bats so they don't move together.
export function Bat({ x, y, s, color, animate, phase = 0 }: { x: number; y: number; s: number; color: string; animate: boolean; phase?: number }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`}>
      <g>
        {animate && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0;0 ${-m.driftPx};0 0`}
            dur={ms(m.driftMs)}
            begin={ms(-phase * m.driftMs)}
            repeatCount="indefinite"
          />
        )}
        <g>
          {animate && <animateTransform attributeName="transform" type="scale" values="1 1;1 0.65;1 1" dur={ms(m.flapMs)} begin={ms(-phase * m.flapMs)} repeatCount="indefinite" />}
          <path
            d="M0 0 C-6 -8 -14 -10 -22 -4 C-18 -2 -16 2 -14 4 C-11 1 -8 2 -6 5 C-4 2 -2 2 0 4 C2 2 4 2 6 5 C8 2 11 1 14 4 C16 2 18 -2 22 -4 C14 -10 6 -8 0 0Z"
            fill={color}
          />
          <circle cx={0} cy={1} r={3.2} fill={color} />
        </g>
      </g>
    </g>
  );
}

// Mixes two #RRGGBB colors: t = 0 gives a, 1 gives b (the jack-o'-lantern's dimming glow).
export function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) =>
      Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase(),
    )
    .join('')}`;
}

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
