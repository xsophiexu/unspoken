import { composite, readableOn, withAlpha } from './color';
import type { RegionColors } from './regions';
import { opacity } from './scales';

// The Halloween looks (website only): play screens where the countdown timer is the art. A candle
// melts, sand drains, a shadow slides over the moon, a potion drains, a spider lowers on its
// thread, a jack-o'-lantern's glow dims. Each look is a layout style (styles.ts) with a `scene`
// slot; the art itself is drawn by the platform from the clock's fraction left (one module per
// look on web). Source: design/word-packs/timer-looks/halloween (gen62hw.py, 2026-10-23).
//
// The night palettes below are the looks' own colors. They color the play page only (the scene
// region); sheets, menus and overlays use the style's pinned palette in dark.

export const SCENE_LOOKS = ['candle', 'hourglass', 'moon', 'potion', 'spider', 'jack'] as const;
export type SceneLook = (typeof SCENE_LOOKS)[number];

// A page background: a radial glow centered at `at` (percent of the page), or a top-to-bottom
// linear fade. Stops are [color, position 0..1].
export type SceneGradient =
  | { kind: 'radial'; at: readonly [x: number, y: number]; stops: readonly (readonly [color: string, at: number])[] }
  | { kind: 'linear'; stops: readonly (readonly [color: string, at: number])[] };

export type ScenePalette = {
  background: SceneGradient;
  // The page color text is drawn on: the gradient's middle stop. Every stop is checked too.
  bg: string;
  ink: string;
  // "Your word", the status line and the swipe hint.
  muted: string;
  // The DON'T SAY label and Correct →.
  label: string;
  // Banned-word chips and the menu button (translucent white over the gradient).
  chip: string;
  // Hairlines between banned rows.
  rule: string;
  // The time pill (or the potion's paper tag) and the text on it.
  pill: string;
  onPill: string;
  // The faint stars over the page.
  star: string;
};

// How a look arranges the word, the banned list and the art between the header and the controls.
//  side       word and list in a column on the left, the art in a column on the right (Candle, Spider)
//  artMiddle  word on top, the art in the middle, the list under it (Hourglass)
//  artTop     the art on top, word and list under it (Moon)
//  artBottom  word and list on top, the art under them (Potion, Jack-o'-lantern)
export type SceneLayout = 'side' | 'artMiddle' | 'artTop' | 'artBottom';

export type SceneSlot = {
  look: SceneLook;
  layout: SceneLayout;
  // Word and list alignment.
  align: 'start' | 'center';
  // The clock's holder: a rounded pill, or a paper tag tied to the potion's neck.
  holder: 'pill' | 'tag';
};

const gold = '#E3C878';

export const scenePalettes: Readonly<Record<SceneLook, ScenePalette>> = {
  candle: {
    background: { kind: 'radial', at: [74, 60], stops: [['#3A2550', 0], ['#22163A', 0.45], ['#150E24', 1]] },
    bg: '#22163A',
    ink: '#F3EDFB',
    muted: '#B9A9D6',
    label: gold,
    chip: '#FFFFFF16',
    rule: '#FFFFFF1C',
    pill: gold,
    onPill: '#22163A',
    star: '#E9DDF7',
  },
  hourglass: {
    background: { kind: 'radial', at: [50, 42], stops: [['#26303B', 0], ['#161D25', 0.6], ['#0E1318', 1]] },
    bg: '#161D25',
    ink: '#EEF2F4',
    muted: '#9EB0BC',
    label: gold,
    chip: '#FFFFFF16',
    rule: '#FFFFFF1C',
    pill: gold,
    onPill: '#161D25',
    star: '#DDE6EA',
  },
  moon: {
    background: { kind: 'linear', stops: [['#0D1626', 0], ['#16243A', 0.6], ['#1C2B44', 1]] },
    bg: '#16243A',
    ink: '#EEF3FA',
    muted: '#9FB2CC',
    label: gold,
    chip: '#FFFFFF16',
    rule: '#FFFFFF1C',
    pill: '#FFFFFF18',
    onPill: '#EEF3FA',
    star: '#E8EEF8',
  },
  potion: {
    background: { kind: 'radial', at: [50, 80], stops: [['#2C1F44', 0], ['#1A1229', 0.6], ['#110B1B', 1]] },
    bg: '#1A1229',
    ink: '#F2ECFA',
    muted: '#B3A3CF',
    label: gold,
    chip: '#FFFFFF16',
    rule: '#FFFFFF1C',
    pill: '#F2E8D2',
    onPill: '#2A1E3A',
    star: '#E8DDF8',
  },
  spider: {
    background: { kind: 'linear', stops: [['#17151C', 0], ['#1F1B26', 1]] },
    bg: '#1B1821',
    ink: '#F1EEF6',
    muted: '#A7A0B6',
    label: gold,
    chip: '#FFFFFF16',
    rule: '#FFFFFF1C',
    pill: gold,
    onPill: '#1A1720',
    star: '#E8E4F0',
  },
  jack: {
    background: { kind: 'radial', at: [50, 74], stops: [['#2A1A10', 0], ['#160F0A', 0.55], ['#0D0906', 1]] },
    bg: '#160F0A',
    ink: '#FBF1E2',
    muted: '#C9AE8E',
    label: gold,
    chip: '#FFFFFF14',
    rule: '#FFFFFF1C',
    pill: '#F6B04A',
    onPill: '#1A0F08',
    star: '#F4E6D0',
  },
};

// Layout of the scene arrangement. sideArtShare: the art column's share of the width in the side
// layout (the art runs out to the window's edge past the side margin). pill* and tag*: the time
// holder (a pill, or the potion's paper tag tilted by tagTilt degrees). board: the play page the
// designs are drawn on (372 × 826 inside the phone frame); art and star positions are in its px.
export const scene = {
  sideArtShare: 0.46,
  tagTilt: 8,
  pillHeight: 34,
  pillPaddingX: 13,
  tagRadius: 6,
  tagPaddingX: 10,
  tagShadow: '0 6px 12px #00000055',
  board: { width: 372, height: 826 },
} as const;

// The play page's region colors for a look, in the same slots every slot component reads.
export function sceneRegionColors(look: SceneLook): RegionColors {
  const p = scenePalettes[look];
  const chip = p.chip;
  const disabled = composite(withAlpha(composite(chip, p.bg), opacity.disabled), p.bg);
  return {
    bg: p.bg,
    ink: p.ink,
    muted: p.muted,
    accentText: p.label,
    accent: p.pill,
    onAccent: p.onPill,
    chip,
    chipInk: p.ink,
    tint: chip,
    rule: p.rule,
    outline: withAlpha(p.muted, 0.45),
    track: withAlpha(p.ink, 0.12),
    progress: p.label,
    vivid: p.label,
    disabled,
    disabledInk: readableOn(p.muted, disabled),
    disabledAccent: readableOn(p.label, disabled),
  };
}

// Every color the page shows behind text: the flat page color and each gradient stop.
export function scenePageColors(look: SceneLook): string[] {
  const p = scenePalettes[look];
  return [p.bg, ...p.background.stops.map(([color]) => color)];
}
