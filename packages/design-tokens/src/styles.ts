import type { ColorId } from './palettes';
import type { RadiusName } from './scales';
import type { RegionTone } from './regions';

// Layout styles as data. Every platform implements a small set of slot components once (header,
// timer, stats, word, banned list, controls), each with a few variants, plus one screen frame per
// arrangement. A style picks a variant and options for each slot and says which region tone each
// part of the screen uses. Adding a style is adding an entry here, not new screen code.
//
// Source: "Current interface · Styles · favorites (all on Customize)" on the design canvas. The
// Card header keeps the current title-and-badge (the "mode button options" row is on hold) and
// Deck is the single ruled-card version.

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
  // Chip look: outlined, region chip fill, or inverted (ink fill, bg text).
  fill?: 'outlined' | 'filled' | 'inverse';
  // Where the clock text sits next to a bar, or hidden (the bar alone shows time).
  clockAt?: 'start' | 'end' | 'none';
  bar?: TimerBar;
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
  color: 'ink' | 'accentText';
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
  //  roundIcon  circle with an arrow and a label below (Bottom)
  //  outline    outlined button
  //  filled     region chip fill
  skip: 'link' | 'round' | 'roundIcon' | 'outline' | 'filled';
  // Fixed Skip width; otherwise Skip and Correct share the row by ratio.
  skipWidth?: number;
  ratio?: readonly [skip: number, correct: number];
  // swipeLinks: growing bars under the links (Card) or a "swipe the card" hint between them (Deck).
  hint?: 'bars' | 'text';
  correctIcon?: boolean;
};

export type StyleRegions = {
  // The page behind everything.
  page: RegionTone;
  // The word container (tile or card), when the word has one.
  word?: RegionTone;
  // The lower panel or sheet, for lowerPanel and sheet arrangements.
  lower?: RegionTone;
  // The controls row, when it differs from what surrounds it.
  controls?: RegionTone;
  // splitBar halves.
  skip?: RegionTone;
  correct?: RegionTone;
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
    timer: { variant: 'ring' },
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
  // Split · word on the page, list on a tinted lower half, split bar. Always sage.
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
    controls: { variant: 'splitBar', height: 96, radius: 'none', skip: 'filled', skipWidth: 150 },
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
  // Ink · dark lower panel.
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
  },
  // Bottom · band flipped to the bottom.
  bottom: {
    id: 'bottom',
    color: follow,
    thumbnailColor: 'slateBlue',
    arrangement: 'lowerPanel',
    regions: { page: 'canvas', lower: 'panel' },
    header: { variant: 'inline', position: 'aboveWord', container: 'none', size: 14, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'dial', size: 56 },
    stats: { placement: 'underWord', emphasis: 'plain' },
    word: { container: 'none', label: false, size: 58, minSize: 24, maxLines: 2, color: 'accentText' },
    banned: { variant: 'tileGrid', size: 18, weight: 500, label: true, chipRadius: 'md', rowHeight: 58 },
    controls: { variant: 'pills', height: 64, radius: 'pill', skip: 'roundIcon', correctIcon: true },
  },
  // Sheet · word on an accent page, numbered list on a sheet below. Always clay.
  sheet: {
    id: 'sheet',
    color: { kind: 'pinned', color: 'clay' },
    thumbnailColor: 'clay',
    arrangement: 'sheet',
    regions: { page: 'accent', lower: 'base' },
    header: { variant: 'inline', position: 'top', container: 'none', size: 22, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'bar', size: 14, clockAt: 'end', bar: { placement: 'belowWord', thickness: 5, bleed: false } },
    stats: { placement: 'footer', emphasis: 'bigNumber' },
    word: { container: 'none', label: false, size: 52, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'numberedRows', size: 19, weight: 500, label: true, numbering: 'leading' },
    controls: { variant: 'buttons', height: 56, radius: 'xl', skip: 'filled', ratio: [1, 2] },
  },
  // Big timer (Cream on the canvas).
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
  },
  // Chips · small chips, full-width split bar (Slate on the canvas).
  chips: {
    id: 'chips',
    color: follow,
    thumbnailColor: 'slateBlue',
    arrangement: 'stack',
    regions: { page: 'base', skip: 'surface', correct: 'panel' },
    header: { variant: 'caps', position: 'aboveWord', container: 'none', size: 12, menu: 'dots', menuContainer: 'filled' },
    timer: { variant: 'chip', fill: 'inverse', bar: { placement: 'aboveControls', thickness: 4, bleed: true } },
    stats: { placement: 'header', emphasis: 'plain' },
    word: { container: 'none', label: false, size: 54, minSize: 24, maxLines: 2, color: 'ink' },
    banned: { variant: 'chips', size: 17, weight: 500, label: true, chipRadius: 'xs' },
    controls: { variant: 'splitBar', height: 96, radius: 'none', skip: 'filled', skipWidth: 150 },
  },
  // Ombre · graded bands, dark footer.
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
  },
};

export const DEFAULT_STYLE: StyleId = 'card';
