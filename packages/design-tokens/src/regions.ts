import { withAlpha } from './color';
import type { ColorRole, ColorRoles } from './palettes';

// A region is a block of the screen with its own background: the page, the Card word tile, Ink's
// dark lower panel, Sheet's accent top, the Ombre footer in dark. Slot components never pick
// palette roles directly; they read the colors of the region they sit in, so the same component
// works on any background.

export const REGION_TONES = ['canvas', 'base', 'surface', 'raised', 'accent', 'panel', 'deep', 'shade'] as const;
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
  // An accent-tinted chip, for lists that ask for it (banned.chipFill 'tint'); text is chipInk.
  tint: string;
  rule: string;
  outline: string;
  // Timer track and progress.
  track: string;
  progress: string;
  // Big accent numerals and their progress line, for timers that ask for it (timer.vivid).
  vivid: string;
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
  tint: 'accentTint',
  rule: 'rule',
  outline: 'outline',
  track: 'track',
  progress: 'accent',
  vivid: 'accentVivid',
} as const satisfies Partial<Record<RegionSlot, RoleRef>>;

// How each tone maps region slots to palette roles. test/contrast.test.ts checks every text slot
// against its background in every tone, palette and mode.
const regionTones: Readonly<Record<RegionTone, Record<RegionSlot, RoleRef>>> = {
  canvas: { ...base, bg: 'canvas', chip: 'bg' },
  base: { ...base, bg: 'bg', chip: 'surface' },
  // The vivid accent reads on the page colors only; lighter fills keep accentText.
  surface: { ...base, bg: 'surface', chip: 'surfaceRaised', vivid: 'accentText' },
  raised: { ...base, bg: 'surfaceRaised', chip: 'surface', vivid: 'accentText' },
  // An accent page (Sheet's top) or bar (Chips' Correct in dark). Primary controls invert; chips stay
  // solid so their text reads. Headline text is onAccentStrong, pure white in dark.
  accent: {
    bg: 'accent',
    ink: 'onAccentStrong',
    muted: 'onAccentMuted',
    accentText: 'onAccent',
    accent: 'onAccent',
    onAccent: 'accent',
    chip: 'surfaceRaised',
    chipInk: 'ink',
    tint: 'surfaceRaised',
    rule: { role: 'onAccent', alpha: 0.2 },
    outline: { role: 'onAccent', alpha: 0.45 },
    track: { role: 'onAccent', alpha: 0.25 },
    progress: 'onAccent',
    vivid: 'onAccent',
  },
  // The contrasting panel (Ink, Bottom, split-bar Correct, the Ombre footer in light).
  panel: {
    bg: 'panel',
    ink: 'onPanel',
    muted: 'onPanelMuted',
    accentText: 'onPanel',
    accent: 'onPanel',
    onAccent: 'panel',
    chip: { role: 'onPanel', alpha: 0.12 },
    chipInk: 'onPanel',
    tint: { role: 'onPanel', alpha: 0.12 },
    rule: { role: 'onPanel', alpha: 0.14 },
    outline: { role: 'onPanel', alpha: 0.3 },
    track: { role: 'onPanel', alpha: 0.2 },
    progress: 'onPanel',
    vivid: 'onPanel',
  },
  // A deep accent-colored panel (the Ombre footer in dark): a pale accent Correct with dark accent
  // text, light text and an accent outline. In light it matches panel.
  deep: {
    bg: 'deep',
    ink: 'onDeep',
    muted: 'onDeepMuted',
    accentText: 'onDeep',
    accent: 'deepAccent',
    onAccent: 'onDeepAccent',
    chip: { role: 'onDeep', alpha: 0.12 },
    chipInk: 'onDeep',
    tint: { role: 'onDeep', alpha: 0.12 },
    rule: { role: 'onDeep', alpha: 0.14 },
    outline: 'deepOutline',
    track: { role: 'onDeep', alpha: 0.2 },
    progress: 'onDeep',
    vivid: 'onDeep',
  },
  // A dark, quiet accent fill (Chips' Skip bar in dark). In light it matches surface.
  shade: { ...base, bg: 'accentShade', chip: 'accentTint', vivid: 'accentText' },
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
  ['vivid', 'bg'],
  ['onAccent', 'accent'],
  ['chipInk', 'chip'],
  ['chipInk', 'tint'],
];
