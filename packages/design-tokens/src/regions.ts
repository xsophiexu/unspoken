import { withAlpha } from './color';
import type { ColorRole, ColorRoles } from './palettes';

// A region is a block of the screen with its own background: the page, the Card word tile, Ink's
// dark lower panel, Sheet's accent top. Slot components never pick palette roles directly; they
// read the colors of the region they sit in, so the same component works on any background.

export const REGION_TONES = ['canvas', 'base', 'surface', 'raised', 'accent', 'panel'] as const;
export type RegionTone = (typeof REGION_TONES)[number];

export type RegionColors = {
  bg: string;
  ink: string;
  muted: string;
  // Accent-colored text (links, Correct →).
  accentText: string;
  // Filled primary control and the text on it.
  accent: string;
  onAccent: string;
  // Banned-word chips, unselected options and secondary fills, with their text.
  chip: string;
  chipInk: string;
  rule: string;
  outline: string;
  // Timer track and progress.
  track: string;
  progress: string;
};

export type RegionSlot = keyof RegionColors;

// A palette role, optionally at an opacity.
type RoleRef = ColorRole | { role: ColorRole; alpha: number };

const base = {
  ink: 'ink',
  muted: 'muted',
  accentText: 'accentText',
  accent: 'accent',
  onAccent: 'onAccent',
  chipInk: 'ink',
  rule: 'rule',
  outline: 'outline',
  track: 'track',
  progress: 'accent',
} as const satisfies Partial<Record<RegionSlot, RoleRef>>;

// How each tone maps region slots to palette roles. test/contrast.test.ts checks every text slot
// against its background in every tone, palette and mode.
const regionTones: Readonly<Record<RegionTone, Record<RegionSlot, RoleRef>>> = {
  canvas: { ...base, bg: 'canvas', chip: 'bg' },
  base: { ...base, bg: 'bg', chip: 'surface' },
  surface: { ...base, bg: 'surface', chip: 'surfaceRaised' },
  raised: { ...base, bg: 'surfaceRaised', chip: 'surface' },
  // An accent page (Sheet's top). Primary controls invert; chips stay solid so their text reads.
  accent: {
    bg: 'accent',
    ink: 'onAccent',
    muted: 'onAccentMuted',
    accentText: 'onAccent',
    accent: 'onAccent',
    onAccent: 'accent',
    chip: 'surfaceRaised',
    chipInk: 'ink',
    rule: { role: 'onAccent', alpha: 0.2 },
    outline: { role: 'onAccent', alpha: 0.45 },
    track: { role: 'onAccent', alpha: 0.25 },
    progress: 'onAccent',
  },
  // The contrasting panel (Ink, Bottom, split-bar Correct, Ombre footer).
  panel: {
    bg: 'panel',
    ink: 'onPanel',
    muted: 'onPanelMuted',
    accentText: 'onPanel',
    accent: 'onPanel',
    onAccent: 'panel',
    chip: { role: 'onPanel', alpha: 0.12 },
    chipInk: 'onPanel',
    rule: { role: 'onPanel', alpha: 0.14 },
    outline: { role: 'onPanel', alpha: 0.3 },
    track: { role: 'onPanel', alpha: 0.2 },
    progress: 'onPanel',
  },
};

function resolveRef(colors: ColorRoles, ref: RoleRef): string {
  return typeof ref === 'string' ? colors[ref] : withAlpha(colors[ref.role], ref.alpha);
}

export function regionColors(colors: ColorRoles, tone: RegionTone): RegionColors {
  const map = regionTones[tone];
  const out = {} as RegionColors;
  for (const slot of Object.keys(map) as RegionSlot[]) out[slot] = resolveRef(colors, map[slot]);
  return out;
}

// Text slots and the backgrounds they sit on, for contrast checks.
export const REGION_TEXT_PAIRS: readonly (readonly [text: RegionSlot, background: RegionSlot])[] = [
  ['ink', 'bg'],
  ['muted', 'bg'],
  ['accentText', 'bg'],
  ['onAccent', 'accent'],
  ['chipInk', 'chip'],
];
