import { composite, readableOn, withAlpha } from './color';
import type { RegionColors } from './regions';
import { opacity } from './scales';

// The Halloween looks (website only), two kinds:
//
//  Timer looks (SCENE_LOOKS): play screens where the countdown timer is the art: a candle melts as
//  the round runs. Each is a layout style (styles.ts) with a `scene` slot; the art is drawn by the
//  platform from the clock's fraction left (one module per look on web). Source:
//  design/word-packs/timer-looks/halloween (gen62hw.py).
//
//  Favourite looks (FAVOURITE_LOOKS): Kurt's twelve favourites from the word-pack looks
//  (design/word-packs/halloween-favourite-looks, in the order of halloween-favourites-scroll.gif).
//  Each is a layout style with a `decor` slot: the regular header, timer, stats and controls slots,
//  with the look's own art, word and banned-word treatment drawn by the platform (one module per look
//  on web).
//
// The night palettes below are the looks' own colors. They color the play page only (the scene
// region); sheets, menus and overlays use the style's pinned palette in dark.

export const SCENE_LOOKS = ['candle'] as const;
export type SceneLook = (typeof SCENE_LOOKS)[number];

export const FAVOURITE_LOOKS = [
  'graveyard',
  'twoSpiders',
  'witchHat',
  'glowingChips',
  'batCircle',
  'silverMoon',
  'vampire',
  'candles',
  'tarot',
  'littleGhosts',
  'harvestMoon',
  'hauntedHouse',
] as const;
export type FavouriteLook = (typeof FAVOURITE_LOOKS)[number];

// Every look with a night palette.
export const NIGHT_LOOKS = [...SCENE_LOOKS, ...FAVOURITE_LOOKS] as const;
export type NightLook = (typeof NIGHT_LOOKS)[number];

// A page background: a radial glow centered at `at` (percent of the page), as big as `size`
// (percent of the page; the farthest corner when absent), or a top-to-bottom linear fade. Stops are
// [color, position 0..1].
export type SceneGradient =
  | { kind: 'radial'; at: readonly [x: number, y: number]; size?: readonly [width: number, height: number]; stops: readonly (readonly [color: string, at: number])[] }
  | { kind: 'linear'; stops: readonly (readonly [color: string, at: number])[] };

export type ScenePalette = {
  background: SceneGradient;
  // The page color text is drawn on: the gradient's middle stop. Every stop is checked too.
  bg: string;
  ink: string;
  // "Your word", the status line and the swipe hint.
  muted: string;
  // The DON'T SAY label and Correct → (a favourite look's clock and Correct →).
  label: string;
  // Banned-word chips and the menu button (translucent white over the gradient).
  chip: string;
  // Hairlines between banned rows.
  rule: string;
  // The time pill (a favourite look's level badge, Correct button and swipe bar) and the text on it.
  pill: string;
  onPill: string;
  // The faint stars over the page.
  star: string;
};

// How a look arranges the word, the banned list and the art between the header and the controls.
//  side  word and list in a column on the left, the art in a column on the right (Candle)
export type SceneLayout = 'side';

export type SceneSlot = {
  look: SceneLook;
  layout: SceneLayout;
  // Word and list alignment.
  align: 'start' | 'center';
};

// A favourite look: which art and treatment the platform draws, and what the banned list's label
// says (the graveyards' R.I.P. IF YOU SAY, the haunted house's windows; DON'T SAY otherwise).
export type DecorSlot = { look: FavouriteLook; label?: 'rip' | 'windows' };

const gold = '#E3C878';

export const scenePalettes: Readonly<Record<NightLook, ScenePalette>> = {
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

  // Favourite looks: the source files' colors (N9-p07, N25-cw02, …; see FAVOURITE_LOOKS).
  graveyard: {
    background: { kind: 'radial', at: [50, 30], stops: [['#22424C', 0], ['#132830', 0.6], ['#0D1D23', 1]] },
    bg: '#132830',
    ink: '#EAF4F3',
    muted: '#9CC7C1',
    label: '#9CCFC9',
    chip: '#FFFFFF14',
    rule: '#FFFFFF14',
    pill: '#9CCFC9',
    onPill: '#0D1D23',
    star: '#D9EFEC',
  },
  twoSpiders: {
    background: { kind: 'linear', stops: [['#17130F', 0], ['#17130F', 1]] },
    bg: '#17130F',
    ink: '#FBE9D2',
    muted: '#E8A15A',
    label: '#F6A65A',
    chip: '#FFFFFF14',
    rule: '#FBE9D222',
    pill: '#F6A65A',
    onPill: '#1A0F06',
    star: '#FBE9D2',
  },
  witchHat: {
    background: { kind: 'linear', stops: [['#2C1849', 0], ['#241340', 0.5], ['#1C0F33', 1]] },
    bg: '#241340',
    ink: '#F6EFE0',
    muted: '#CDB9E4',
    label: gold,
    chip: '#FFFFFF16',
    rule: '#FFFFFF1C',
    pill: gold,
    onPill: '#1C0F33',
    star: '#F6E7B8',
  },
  glowingChips: {
    background: { kind: 'radial', at: [50, 35], stops: [['#2A1A0E', 0], ['#15100B', 0.65], ['#0E0B08', 1]] },
    bg: '#15100B',
    ink: '#FBE9D2',
    muted: '#F6A65A',
    label: '#F6A65A',
    chip: '#FFFFFF14',
    rule: '#FFFFFF1C',
    pill: '#E8812A',
    onPill: '#1A0F06',
    star: '#FBE9D2',
  },
  batCircle: {
    background: { kind: 'linear', stops: [['#0B1A1E', 0], ['#0D1E21', 0.5], ['#0F2224', 1]] },
    bg: '#0D1E21',
    ink: '#EAF4F3',
    muted: '#9CC7C1',
    label: gold,
    chip: '#FFFFFF14',
    rule: '#FFFFFF1C',
    pill: gold,
    onPill: '#0F2224',
    star: '#E3EEEC',
  },
  silverMoon: {
    background: { kind: 'linear', stops: [['#0B1530', 0], ['#0D1838', 0.5], ['#0F1C40', 1]] },
    bg: '#0D1838',
    ink: '#EEF2F7',
    muted: '#9FAEC6',
    label: '#EEF2F7',
    chip: '#FFFFFF14',
    rule: '#D5DCE655',
    pill: '#D5DCE6',
    onPill: '#0B1530',
    star: '#E8EEF8',
  },
  vampire: {
    background: { kind: 'radial', at: [50, 30], size: [100, 70], stops: [['#561521', 0], ['#370B14', 0.55], ['#22060C', 1]] },
    bg: '#370B14',
    ink: '#EADFC8',
    muted: '#D7A3A5',
    label: '#EADFC8',
    chip: '#FFFFFF16',
    rule: '#EADFC855',
    pill: '#EADFC8',
    onPill: '#3A0E14',
    star: '#EADFC8',
  },
  candles: {
    background: { kind: 'radial', at: [50, 22], stops: [['#2A1A10', 0], ['#160E08', 0.6], ['#0B0704', 1]] },
    bg: '#160E08',
    ink: '#FBE9D2',
    muted: '#E8A15A',
    label: '#F6A65A',
    chip: '#FFFFFF14',
    rule: '#F6A65A2A',
    pill: '#F6A65A',
    onPill: '#1A0F06',
    star: '#FBE9D2',
  },
  tarot: {
    background: { kind: 'linear', stops: [['#5C5461', 0], ['#504A56', 0.5], ['#45404B', 1]] },
    bg: '#504A56',
    ink: '#F2ECE4',
    // The source's #C6BCC6, lightened to read on the lightest stop.
    muted: '#DDD4DD',
    label: '#F2ECE4',
    chip: '#FFFFFF12',
    rule: '#FFFFFF26',
    pill: '#D2BC84',
    onPill: '#2E2933',
    star: '#E6DCCA',
  },
  littleGhosts: {
    background: { kind: 'radial', at: [50, 30], stops: [['#22424C', 0], ['#132830', 0.6], ['#0D1D23', 1]] },
    bg: '#132830',
    ink: '#EAF4F3',
    muted: '#9CC7C1',
    label: '#9CCFC9',
    chip: '#FFFFFF14',
    rule: '#FFFFFF14',
    pill: '#9CCFC9',
    onPill: '#0D1D23',
    star: '#D9EFEC',
  },
  harvestMoon: {
    background: { kind: 'radial', at: [50, 80], size: [90, 50], stops: [['#4A2410', 0], ['#24120A', 0.5], ['#130A05', 1]] },
    bg: '#24120A',
    ink: '#FBE9D2',
    muted: '#E8A15A',
    label: '#F6A65A',
    chip: '#FFFFFF14',
    rule: '#F6A65A2E',
    pill: '#F6A65A',
    onPill: '#1A0F06',
    star: '#FBE9D2',
  },
  hauntedHouse: {
    background: { kind: 'linear', stops: [['#2A0A12', 0], ['#2A0A12', 1]] },
    bg: '#2A0A12',
    ink: '#F4E9D8',
    muted: '#D7A3A5',
    label: '#EADFC8',
    chip: '#FFFFFF14',
    rule: '#FFFFFF1C',
    pill: '#EADFC8',
    onPill: '#3A0E14',
    star: '#F4E9D8',
  },
};

// Layout of the scene arrangement. sideArtShare: the art column's share of the width in the side
// layout (the art runs out to the window's edge past the side margin). pill*: the time pill.
// board: the play page the designs are drawn on (372 × 826 inside the phone frame); art and star
// positions are in its px (the favourite looks scale them with the game column's width).
export const scene = { sideArtShare: 0.46, pillHeight: 34, pillPaddingX: 13, board: { width: 372, height: 826 } } as const;

// The play page's region colors for a look, in the same slots every slot component reads.
export function sceneRegionColors(look: NightLook): RegionColors {
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
export function scenePageColors(look: NightLook): string[] {
  const p = scenePalettes[look];
  return [p.bg, ...p.background.stops.map(([color]) => color)];
}
