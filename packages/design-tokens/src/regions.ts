import { composite, readableOn, withAlpha } from './color';
import type { ColorRole, ColorRoles } from './palettes';
import { opacity } from './scales';

// A region is a block of the screen with its own background: the page, the Card word tile, Ink's
// dark lower panel, Sheet's accent top, the Ombre footer in dark. Slot components never pick
// palette roles directly; they read the colors of the region they sit in, so the same component
// works on any background.

// Tone names are single lowercase words: web builds CSS custom property names from them.
export const REGION_TONES = ['canvas', 'base', 'surface', 'raised', 'accent', 'panel', 'deep', 'shade', 'accented', 'shadowed', 'stone', 'bare', 'sunken', 'frosted'] as const;
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
  // A control that can't be used yet (Coming soon modes), faded rather than greyed: the chip at
  // opacity.disabled over the region, so the page shows through. disabledInk is muted and
  // disabledAccent is accentText (the Coming soon pill's text and outline), each kept at its own
  // hue and moved only as far in lightness as it takes to read at AA on that fill.
  disabled: string;
  disabledInk: string;
  disabledAccent: string;
};

export type RegionSlot = keyof RegionColors;

// Slots worked out from the others in regionColors rather than mapped to a palette role.
type DerivedSlot = 'disabled' | 'disabledInk' | 'disabledAccent';
type MappedSlot = Exclude<RegionSlot, DerivedSlot>;

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
} as const satisfies Partial<Record<MappedSlot, RoleRef>>;

// An accent page (Sheet's top) or bar (Chips' Correct in dark). Primary controls invert; chips stay
// solid so their text reads. Headline text is onAccentStrong, pure white in dark.
const accentTone: Record<MappedSlot, RoleRef> = {
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
};

// The contrasting panel (Ink, Bottom, split-bar Correct, the Ombre footer in light).
const panelTone: Record<MappedSlot, RoleRef> = {
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
};

// How each tone maps region slots to palette roles. test/contrast.test.ts checks every text slot
// against its background in every tone, palette and mode.
const regionTones: Readonly<Record<RegionTone, Record<MappedSlot, RoleRef>>> = {
  canvas: { ...base, bg: 'canvas', chip: 'bg' },
  base: { ...base, bg: 'bg', chip: 'surface' },
  // The vivid accent reads on the page colors only; lighter fills keep accentText.
  surface: { ...base, bg: 'surface', chip: 'surfaceRaised', vivid: 'accentText' },
  raised: { ...base, bg: 'surfaceRaised', chip: 'surface', vivid: 'accentText' },
  accent: accentTone,
  panel: panelTone,
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
  // An accent-colored lower panel (Bottom): tiles tinted with surfaceRaised, a surfaceRaised
  // Correct with accent text and a surfaceRaised outline (white in light, stone grey in dark).
  accented: {
    bg: 'accentPanel',
    ink: 'onAccent',
    muted: 'onAccentMuted',
    accentText: 'onAccent',
    accent: 'surfaceRaised',
    onAccent: 'accentText',
    chip: { role: 'surfaceRaised', alpha: 0.12 },
    chipInk: 'onAccent',
    tint: { role: 'surfaceRaised', alpha: 0.12 },
    rule: { role: 'onAccent', alpha: 0.2 },
    outline: { role: 'surfaceRaised', alpha: 0.45 },
    track: { role: 'onAccent', alpha: 0.25 },
    progress: 'onAccent',
    vivid: 'onAccent',
  },
  // An accent page whose progress line and menu button are stone-grey tints instead of white
  // (Sheet's top in dark). The menu tint is panel, which in dark is within a step of surfaceRaised
  // and keeps the light icon on it at AA in light too.
  shadowed: {
    ...accentTone,
    chip: { role: 'panel', alpha: 0.18 },
    chipInk: 'onAccentStrong',
    tint: { role: 'panel', alpha: 0.18 },
    track: { role: 'surfaceRaised', alpha: 0.25 },
    progress: 'surfaceRaised',
  },
  // The grey panel with a raised Correct in ink and no visible hairlines between rows (Ink's lower
  // panel in dark).
  stone: { ...panelTone, accent: 'surfaceRaised', onAccent: 'ink', rule: 'panel' },
  // The page with no visible timer track: the line runs over the page color (Chips).
  bare: { ...base, bg: 'bg', chip: 'surface', track: 'bg' },
  // A recessed fill in the track color (Split's lower half and Skip bar in dark). Surface in light.
  sunken: { ...base, bg: 'sunken', chip: 'surfaceRaised', vivid: 'accentText' },
  // An accent top row whose menu button is white at 18% with white dots (Sheet's header in light).
  // The chip reads for icons only (3:1, not 4.5:1): see ICON_CHIP_TONES.
  frosted: {
    ...accentTone,
    chip: { role: 'onAccent', alpha: 0.18 },
    chipInk: 'onAccentStrong',
    tint: { role: 'onAccent', alpha: 0.18 },
  },
};

function resolveRef(colors: ColorRoles, ref: RoleRef): string {
  return typeof ref === 'string' ? colors[ref] : withAlpha(colors[ref.role], ref.alpha);
}

export function regionColors(colors: ColorRoles, tone: RegionTone): RegionColors {
  const map = regionTones[tone];
  const out = {} as RegionColors;
  for (const slot of Object.keys(map) as MappedSlot[]) out[slot] = resolveRef(colors, map[slot]);
  // Chips can be translucent (panel tones), so flatten onto the region before fading.
  out.disabled = composite(withAlpha(composite(out.chip, out.bg), opacity.disabled), out.bg);
  out.disabledInk = readableOn(out.muted, out.disabled);
  out.disabledAccent = readableOn(out.accentText, out.disabled);
  return out;
}

// Tones whose chip and tint carry icons only, never text: chipInk on them meets the non-text
// minimum (AA_NON_TEXT, 3:1) instead of the text one. Use them only for a header row with an
// unfilled mode label, like Sheet's (test/contrast.test.ts holds every style to that).
export const ICON_CHIP_TONES: readonly RegionTone[] = ['frosted'];

// Text slots and the backgrounds they sit on, for contrast checks.
export const REGION_TEXT_PAIRS: readonly (readonly [text: RegionSlot, background: RegionSlot])[] = [
  ['ink', 'bg'],
  ['muted', 'bg'],
  ['accentText', 'bg'],
  ['vivid', 'bg'],
  ['onAccent', 'accent'],
  ['chipInk', 'chip'],
  ['chipInk', 'tint'],
  ['disabledInk', 'disabled'],
  ['disabledAccent', 'disabled'],
];
