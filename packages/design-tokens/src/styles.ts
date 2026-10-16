import type { ColorId, ColorMode } from './palettes';
import type { RegionTone } from './regions';
import { layout, type RadiusName } from './scales';

// Layout styles as data. Every platform implements a small set of slot components once (header,
// timer, stats, word, banned list, controls), each with a few variants, plus one screen frame per
// arrangement. A style picks a variant and options for each slot and says which region tone each
// part of the screen uses. Adding a style is adding an entry here, not new screen code.
//
// Source: "Current interface · Styles · favorites (all on Customize)" on the design canvas. The
// Card header keeps the current title-and-badge (the "mode button options" row is on hold) and
// Deck is the single ruled-card version. Margins and dark mode follow the 2026-10-16 update
// ("Styles · dark mode (Ink and stone)"): every style takes layout.play margins unless it says
// otherwise (margins, read with playMargins), and a style's `dark` entry changes slots in dark mode
// (read the style for a mode with layoutStyleFor, or resolveTheme).

// Customize lists the styles in this order (page 1: first nine, page 2: the rest and a Suggest tile).
export const STYLE_IDS = ['card', 'deck', 'lines', 'split', 'ledger', 'ink', 'bottom', 'sheet', 'bigTimer', 'chips', 'ombre'] as const;
export type StyleId = (typeof STYLE_IDS)[number];

// Whether the style takes the player's color or always uses its own. Mode (light or dark) always
// applies.
export type ColorPolicy = { kind: 'follow' } | { kind: 'pinned'; color: ColorId };

// How the regions stack on the play screen.
//  ringCard     the word tile sits inside the timer ring, centered (Card)
//  floatingCard a raised card floats between header and controls (Deck)
//  stack        header, word, list and controls flow down one page (Lines, Ledger, Big timer, Chips, Ombre)
//  lowerPanel   the word sits on the page; list and controls fill a lower panel (Split, Ink, Bottom)
//  sheet        an accent page holds header and word; the list and controls sit on a bottom sheet (Sheet)
export type Arrangement = 'ringCard' | 'floatingCard' | 'stack' | 'lowerPanel' | 'sheet';

export type HeaderSlot = {
  //  titleBadge  big mode name, filled level badge, status line below (Card)
  //  pill        "Classic · Expert 1 ▾" in a rounded pill
  //  caps        small caps "CLASSIC · EXPERT 1 ▾"
  //  inline      "Classic · Expert 1 ▾" as plain text
  variant: 'titleBadge' | 'pill' | 'caps' | 'inline';
  // Where the mode and level sit: in the top row, or on their own line just above the word.
  position: 'top' | 'aboveWord';
  // Pill look: no fill, region chip fill, outline, or a light ink tint.
  container: 'none' | 'filled' | 'outlined' | 'tinted';
  // Font size of the mode name.
  size: number;
  // The top-right button. Dots open the game menu; sliders open the same menu with Customize first.
  menu: 'dots' | 'sliders';
  menuContainer: 'none' | 'filled' | 'outlined';
};

export type TimerBar = {
  //  belowHeader    under the header row
  //  belowClock     under a clock that sits on its own line
  //  belowWord      under the word, with the clock beside it
  //  panelTop       full width along the top edge of the lower panel
  //  aboveControls  full width just above the controls
  placement: 'belowHeader' | 'belowClock' | 'belowWord' | 'panelTop' | 'aboveControls';
  thickness: number;
  // Runs edge to edge instead of inside the screen padding.
  bleed: boolean;
};

export type TimerSlot = {
  //  ring      progress runs around the word tile; the clock sits in a gap at the top (Card)
  //  bar       a thin progress line
  //  bigClock  a huge clock with a pause button (Big timer)
  //  chip      the clock and pause in a pill in the header
  //  dial      a small round progress dial with the clock inside, in the header
  variant: 'ring' | 'bar' | 'bigClock' | 'chip' | 'dial';
  // Dial diameter, or the clock's font size for bar and bigClock.
  size?: number;
  // Chip look: outlined, region chip fill, inverted (ink fill, bg text) or accent (accent fill,
  // onAccent text). For the ring, 'none': the clock in the gap has no box behind it.
  fill?: 'none' | 'outlined' | 'filled' | 'inverse' | 'accent';
  // Where the clock text sits next to a bar, or hidden (the bar alone shows time).
  clockAt?: 'start' | 'end' | 'none';
  bar?: TimerBar;
  // The clock digits and the progress line in the region's vivid color (instead of accentText and
  // progress for bigClock, ink and progress for bar).
  vivid?: boolean;
};

export type StatsSlot = {
  //  subline      in the header's status line (Card)
  //  header       stacked at the right of the header row (Chips)
  //  belowHeader  a row under the header (Split)
  //  aboveWord    right-aligned above the word card (Deck)
  //  underWord    under the word (Ledger, Bottom)
  //  footer       a row just above the controls (Lines, Ink, Sheet, Big timer, Ombre)
  placement: 'subline' | 'header' | 'belowHeader' | 'aboveWord' | 'underWord' | 'footer';
  // How the score reads: a plain line, the number big and bold ("7 pts"), or the score in a pill.
  emphasis: 'plain' | 'bigNumber' | 'pill';
};

export type WordSlot = {
  //  tile  a filled tile of the word region tone (Card)
  //  card  a raised card with a shadow (Deck)
  //  none  straight on the page
  container: 'tile' | 'card' | 'none';
  // The small "Your word" label above the word.
  label: boolean;
  // Largest and smallest font sizes; fitWordSize() in @unspoken/core picks one per word and box.
  size: number;
  minSize: number;
  maxLines: number;
  color: 'ink' | 'accentText' | 'muted';
};

export type BannedSlot = {
  //  chips         wrapping chips
  //  table         two-column ruled grid in one bordered block (Deck)
  //  tileGrid      two-column grid of separate tiles (Bottom)
  //  rows          one per row with hairlines (Ink)
  //  numberedRows  rows with a number, leading or trailing, optionally struck through (Sheet, Lines)
  //  columns       two plain columns (Split)
  //  dashedColumns two columns, each word after a short dash (Big timer)
  //  bands         full-width bands graded from light to strong, with × marks (Ombre)
  variant: 'chips' | 'table' | 'tileGrid' | 'rows' | 'numberedRows' | 'columns' | 'dashedColumns' | 'bands';
  size: number;
  weight: 500 | 600;
  // The DON'T SAY label above the list.
  label: boolean;
  chipRadius?: RadiusName;
  numbering?: 'leading' | 'trailing';
  strike?: boolean;
  // Row or band height where rows have a fixed height.
  rowHeight?: number;
  // The DON'T SAY label's color: the region's muted (the default) or accentText.
  labelColor?: 'muted' | 'accentText';
  // Chip and tile fill: the region's chip (the default) or its accent tint (text stays chipInk).
  chipFill?: 'chip' | 'tint';
};

export type ControlsSlot = {
  //  swipeLinks  "← Skip" and "Correct →" text that stretch with the drag, over bars or with a hint
  //  pills       a round or outlined Skip beside a wide pill Correct
  //  buttons     two rounded buttons, Skip and Correct
  //  splitBar    a full-width bar split into Skip and Correct
  variant: 'swipeLinks' | 'pills' | 'buttons' | 'splitBar';
  height: number;
  radius: RadiusName;
  //  link       text link (swipeLinks)
  //  round      circle with the word Skip (Lines)
  //  pillIcon   outlined pill, skipWidth wide and as tall as Correct, with an arrow and the word
  //             Skip inside (Bottom)
  //  roundIcon  circle with an arrow and a label below. No style uses it since 2026-10-16 (Bottom
  //             moved to pillIcon); remove it once the apps no longer render it.
  //  outline    outlined button
  //  filled     region chip fill
  skip: 'link' | 'round' | 'pillIcon' | 'roundIcon' | 'outline' | 'filled';
  // Fixed Skip width; otherwise Skip and Correct share the row by ratio.
  skipWidth?: number;
  ratio?: readonly [skip: number, correct: number];
  // swipeLinks: growing bars under the links (Card) or a "swipe the card" hint between them (Deck).
  hint?: 'bars' | 'text';
  correctIcon?: boolean;
  // splitBar: space under the labels inside the bar (the labels center in what is left), so they
  // sit clear of the screen's rounded corners. A bottom safe area adds to it.
  paddingBottom?: number;
};

export type StyleRegions = {
  // The page behind everything.
  page: RegionTone;
  // The word container (tile or card), when the word has one.
  word?: RegionTone;
  // The lower panel or sheet, for lowerPanel and sheet arrangements.
  lower?: RegionTone;
  // The top row (mode and level, header stats or clock, the menu button), when it differs from the
  // page. The page tone still holds the word and the overlays.
  header?: RegionTone;
  // The controls row, when it differs from what surrounds it.
  controls?: RegionTone;
  // splitBar halves.
  skip?: RegionTone;
  correct?: RegionTone;
};

// How the lower panel of a lowerPanel style sits: 'fill' (the default) takes all the space under
// the word; 'content' wraps the list and controls at the bottom, with rounded top corners (Bottom).
export type PanelSlot = { size: 'fill' | 'content'; radius: RadiusName };

// Play screen margins (px or dp). See layout.play.
export type PlayMargins = { paddingX: number; paddingTop: number; paddingBottom: number; footerTop: number };

// Slot changes for one mode, merged over the style's own slots one level deep (a timer `bar` given
// here replaces the whole bar).
export type StyleOverride = {
  regions?: Partial<StyleRegions>;
  header?: Partial<HeaderSlot>;
  timer?: Partial<TimerSlot>;
  stats?: Partial<StatsSlot>;
  word?: Partial<WordSlot>;
  banned?: Partial<BannedSlot>;
  controls?: Partial<ControlsSlot>;
};

export type LayoutStyle = {
  id: StyleId;
  color: ColorPolicy;
  // The color Customize shows the thumbnail in, matching the designs.
  thumbnailColor: ColorId;
  arrangement: Arrangement;
  regions: StyleRegions;
  header: HeaderSlot;
  timer: TimerSlot;
  stats: StatsSlot;
  word: WordSlot;
  banned: BannedSlot;
  controls: ControlsSlot;
  panel?: PanelSlot;
  // Top and bottom margins where the style differs from layout.play.
  margins?: Partial<Pick<PlayMargins, 'paddingTop' | 'paddingBottom'>>;
  // What changes in dark mode.
  dark?: StyleOverride;
};

const follow: ColorPolicy = { kind: 'follow' };

export const layoutStyles: Readonly<Record<StyleId, LayoutStyle>> = {
  // Card · current layout. The app today.
  card: {
    id: 'card',
    color: follow,
    thumbnailColor: 'teal',
    arrangement: 'ringCard',
    regions: { page: 'base', word: 'surface' },
    header: { variant: 'titleBadge', position: 'top', container: 'none', size: 26, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'ring', fill: 'none' },
    stats: { placement: 'subline', emphasis: 'plain' },
    word: { container: 'tile', label: true, size: 50, minSize: 22, maxLines: 2, color: 'ink' },
    banned: { variant: 'chips', size: 18, weight: 500, label: true, chipRadius: 'sm' },
    controls: { variant: 'swipeLinks', height: 46, radius: 'none', skip: 'link', ratio: [1, 2], hint: 'bars' },
  },
  // Deck · ruled card.
  deck: {
    id: 'deck',
    color: follow,
    thumbnailColor: 'teal',
    arrangement: 'floatingCard',
    regions: { page: 'base', word: 'raised' },
    header: { variant: 'pill', position: 'top', container: 'outlined', size: 15, menu: 'sliders', menuContainer: 'none' },
    timer: { variant: 'chip', fill: 'outlined', bar: { placement: 'belowHeader', thickness: 4, bleed: false } },
    stats: { placement: 'aboveWord', emphasis: 'bigNumber' },
    word: { container: 'card', label: true, size: 44, minSize: 22, maxLines: 2, color: 'ink' },
    banned: { variant: 'table', size: 18, weight: 500, label: true },
    controls: { variant: 'swipeLinks', height: 46, radius: 'none', skip: 'link', hint: 'text' },
  },
  // Lines · crossed-out words.
  lines: {
    id: 'lines',
    color: follow,
    thumbnailColor: 'lilac',
    arrangement: 'stack',
    regions: { page: 'base' },
    header: { variant: 'pill', position: 'top', container: 'tinted', size: 14, menu: 'dots', menuContainer: 'outlined' },
    timer: { variant: 'bar', size: 13, clockAt: 'start', bar: { placement: 'belowHeader', thickness: 5, bleed: false } },
    stats: { placement: 'footer', emphasis: 'bigNumber' },
    word: { container: 'none', label: false, size: 54, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'numberedRows', size: 19, weight: 600, label: true, numbering: 'trailing', strike: true },
    controls: { variant: 'pills', height: 56, radius: 'pill', skip: 'round' },
  },
  // Split · word on the page, list on a tinted lower half, split bar to the bottom edge. Always sage.
  // In dark the lower half and Skip sink to the track color and the DON'T SAY label is accentText.
  split: {
    id: 'split',
    color: { kind: 'pinned', color: 'sage' },
    thumbnailColor: 'sage',
    arrangement: 'lowerPanel',
    regions: { page: 'base', lower: 'surface', skip: 'surface', correct: 'panel' },
    header: { variant: 'pill', position: 'top', container: 'tinted', size: 14, menu: 'sliders', menuContainer: 'none' },
    timer: { variant: 'bar', clockAt: 'none', bar: { placement: 'panelTop', thickness: 4, bleed: true } },
    stats: { placement: 'belowHeader', emphasis: 'plain' },
    word: { container: 'none', label: false, size: 58, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'columns', size: 22, weight: 500, label: true },
    // Shorter than Ledger's bar, so Skip and Correct sit close to the bottom edge.
    controls: { variant: 'splitBar', height: 76, radius: 'none', skip: 'filled', skipWidth: 150, paddingBottom: 6 },
    margins: { paddingBottom: 0 },
    dark: { regions: { lower: 'sunken', skip: 'sunken' }, banned: { labelColor: 'accentText' } },
  },
  // Ledger · full color, ring timer.
  ledger: {
    id: 'ledger',
    color: follow,
    thumbnailColor: 'teal',
    arrangement: 'stack',
    regions: { page: 'surface' },
    header: { variant: 'caps', position: 'top', container: 'none', size: 12, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'dial', size: 52 },
    stats: { placement: 'underWord', emphasis: 'pill' },
    word: { container: 'none', label: false, size: 62, minSize: 26, maxLines: 2, color: 'accentText' },
    banned: { variant: 'chips', size: 18, weight: 500, label: true, chipRadius: 'pill' },
    controls: { variant: 'pills', height: 60, radius: 'pill', skip: 'outline', skipWidth: 120 },
  },
  // Ink · dark lower panel. In dark, Correct is a raised stone button with ink text and the rows
  // have no visible hairlines.
  ink: {
    id: 'ink',
    color: follow,
    thumbnailColor: 'slateBlue',
    arrangement: 'lowerPanel',
    regions: { page: 'base', lower: 'panel' },
    header: { variant: 'inline', position: 'aboveWord', container: 'none', size: 18, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'bar', size: 14, clockAt: 'end', bar: { placement: 'panelTop', thickness: 4, bleed: true } },
    stats: { placement: 'footer', emphasis: 'bigNumber' },
    word: { container: 'none', label: false, size: 52, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'rows', size: 19, weight: 500, label: true },
    controls: { variant: 'buttons', height: 56, radius: 'xl', skip: 'outline', ratio: [1, 2] },
    dark: { regions: { lower: 'stone' } },
  },
  // Bottom · band flipped to the bottom, on an accent-colored panel.
  bottom: {
    id: 'bottom',
    color: follow,
    thumbnailColor: 'slateBlue',
    arrangement: 'lowerPanel',
    regions: { page: 'canvas', lower: 'accented' },
    header: { variant: 'inline', position: 'aboveWord', container: 'none', size: 14, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'dial', size: 56 },
    stats: { placement: 'underWord', emphasis: 'plain' },
    word: { container: 'none', label: false, size: 58, minSize: 24, maxLines: 2, color: 'accentText' },
    banned: { variant: 'tileGrid', size: 18, weight: 500, label: true, chipRadius: 'md', rowHeight: 58 },
    controls: { variant: 'pills', height: 64, radius: 'pill', skip: 'pillIcon', skipWidth: 116, correctIcon: true },
    panel: { size: 'content', radius: 'ring' },
  },
  // Sheet · word on an accent page, numbered list on a full-width sheet below. Always clay. The page
  // starts lower (44) and the sheet keeps its buttons low (22 under them). In light the menu button
  // is white at 18% (frosted header row); in dark the progress line and menu button on the accent
  // page are stone-grey tints.
  sheet: {
    id: 'sheet',
    color: { kind: 'pinned', color: 'clay' },
    thumbnailColor: 'clay',
    arrangement: 'sheet',
    regions: { page: 'accent', header: 'frosted', lower: 'base' },
    header: { variant: 'inline', position: 'top', container: 'none', size: 22, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'bar', size: 14, clockAt: 'end', bar: { placement: 'belowWord', thickness: 5, bleed: false } },
    stats: { placement: 'footer', emphasis: 'bigNumber' },
    word: { container: 'none', label: false, size: 52, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'numberedRows', size: 19, weight: 500, label: true, numbering: 'leading' },
    controls: { variant: 'buttons', height: 56, radius: 'xl', skip: 'filled', ratio: [1, 2] },
    margins: { paddingTop: 44, paddingBottom: 22 },
    dark: { regions: { page: 'shadowed', header: 'shadowed' } },
  },
  // Big timer (Cream on the canvas). In dark the clock and its line are the vivid accent and the
  // word is muted.
  bigTimer: {
    id: 'bigTimer',
    color: follow,
    thumbnailColor: 'mustard',
    arrangement: 'stack',
    regions: { page: 'base' },
    header: { variant: 'pill', position: 'top', container: 'filled', size: 15, menu: 'sliders', menuContainer: 'none' },
    timer: { variant: 'bigClock', size: 92, bar: { placement: 'belowClock', thickness: 2, bleed: false } },
    stats: { placement: 'footer', emphasis: 'bigNumber' },
    word: { container: 'none', label: false, size: 56, minSize: 24, maxLines: 2, color: 'accentText' },
    banned: { variant: 'dashedColumns', size: 21, weight: 500, label: true },
    controls: { variant: 'buttons', height: 60, radius: 'lg', skip: 'outline', ratio: [1, 2] },
    dark: { timer: { vivid: true }, word: { color: 'muted' } },
  },
  // Chips · small chips, full-width split bar to the bottom edge (Slate on the canvas). In dark the
  // timer pill and Correct are accent, Skip a dark accent shade, the chips accent-tinted and the
  // DON'T SAY label accentText. The line above the bar has no visible track (bare page).
  chips: {
    id: 'chips',
    color: follow,
    thumbnailColor: 'slateBlue',
    arrangement: 'stack',
    regions: { page: 'bare', skip: 'surface', correct: 'panel' },
    header: { variant: 'caps', position: 'aboveWord', container: 'none', size: 12, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'chip', fill: 'inverse', bar: { placement: 'aboveControls', thickness: 4, bleed: true } },
    stats: { placement: 'header', emphasis: 'plain' },
    word: { container: 'none', label: false, size: 54, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'chips', size: 17, weight: 500, label: true, chipRadius: 'xs' },
    controls: { variant: 'splitBar', height: 110, radius: 'none', skip: 'filled', skipWidth: 150, paddingBottom: 14 },
    margins: { paddingBottom: 0 },
    dark: {
      regions: { skip: 'shade', correct: 'accent' },
      timer: { fill: 'accent' },
      banned: { chipFill: 'tint', labelColor: 'accentText' },
    },
  },
  // Ombre · graded bands, dark footer. In dark the footer is a deep accent tone with a pale Correct.
  ombre: {
    id: 'ombre',
    color: follow,
    thumbnailColor: 'sage',
    arrangement: 'stack',
    regions: { page: 'base', controls: 'panel' },
    header: { variant: 'pill', position: 'top', container: 'filled', size: 15, menu: 'sliders', menuContainer: 'none' },
    timer: { variant: 'bar', size: 30, clockAt: 'end', bar: { placement: 'belowClock', thickness: 3, bleed: false } },
    stats: { placement: 'footer', emphasis: 'bigNumber' },
    word: { container: 'none', label: false, size: 60, minSize: 26, maxLines: 2, color: 'ink' },
    banned: { variant: 'bands', size: 20, weight: 500, label: false, rowHeight: 56 },
    controls: { variant: 'buttons', height: 58, radius: 'lg', skip: 'outline', skipWidth: 120 },
    dark: { regions: { controls: 'deep' } },
  },
};

export const DEFAULT_STYLE: StyleId = 'card';

function withOverride(style: LayoutStyle, o: StyleOverride | undefined): LayoutStyle {
  if (!o) return style;
  return {
    ...style,
    regions: { ...style.regions, ...o.regions },
    header: { ...style.header, ...o.header },
    timer: { ...style.timer, ...o.timer },
    stats: { ...style.stats, ...o.stats },
    word: { ...style.word, ...o.word },
    banned: { ...style.banned, ...o.banned },
    controls: { ...style.controls, ...o.controls },
  };
}

const stylesByMode: Readonly<Record<ColorMode, Readonly<Record<StyleId, LayoutStyle>>>> = {
  light: layoutStyles,
  dark: Object.fromEntries(STYLE_IDS.map((id) => [id, withOverride(layoutStyles[id], layoutStyles[id].dark)])) as Record<StyleId, LayoutStyle>,
};

// A style as drawn in a mode: the catalog entry, with its `dark` changes merged in for dark. The
// same object comes back on every call. resolveTheme uses it, so theme.style is already resolved.
export function layoutStyleFor(id: StyleId, mode: ColorMode): LayoutStyle {
  return stylesByMode[mode][id];
}

// The play screen's margins in a style: layout.play with the style's own top and bottom. The side
// margin is the same everywhere; panels, sheets, bands and bars that run edge to edge bleed out by
// it, and their content is inset by it.
export function playMargins(style: LayoutStyle): PlayMargins {
  return { ...layout.play, ...style.margins };
}

// The Card timer ring for the space it can take: as wide as that space, up to
// layout.card.maxWidth, and as tall as the maxWidth × maxHeight shape gives at that width, never
// taller than the space (326 × 540 on the reference screen with layout.play margins).
export function ringCardSize(width: number, height: number): { width: number; height: number } {
  const { maxWidth, maxHeight } = layout.card;
  const w = Math.max(0, Math.min(width, maxWidth));
  return { width: w, height: Math.max(0, Math.min(height, (w * maxHeight) / maxWidth)) };
}
