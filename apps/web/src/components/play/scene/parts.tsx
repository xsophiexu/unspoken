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
  // Ambient motion (flicker, flapping, sway) on; off under reduced motion and in previews.
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
