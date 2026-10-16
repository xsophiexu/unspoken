import type { GlyphMetrics } from '@unspoken/core';

export const FONT_WEIGHTS = [400, 500, 600, 700, 800] as const;
export type FontWeight = (typeof FONT_WEIGHTS)[number];

export const fonts = {
  // Web: load Manrope 400–800 from Google Fonts (or next/font) and use this stack.
  family: 'Manrope',
  webStack: "'Manrope', system-ui, sans-serif",
  // React Native: one family per weight, as registered by @expo-google-fonts/manrope.
  native: {
    400: 'Manrope_400Regular',
    500: 'Manrope_500Medium',
    600: 'Manrope_600SemiBold',
    700: 'Manrope_700Bold',
    800: 'Manrope_800ExtraBold',
  } satisfies Record<FontWeight, string>,
} as const;

// A text style. Sizes in px (dp on native). lineHeight and letterSpacing are relative to the size
// (letterSpacing in em), so a style can be scaled and resolved to px for any size.
export type TextStyleToken = {
  size: number;
  weight: FontWeight;
  lineHeight?: number;
  letterSpacing?: number;
  tabular?: boolean;
  uppercase?: boolean;
};

// Measured from the boards on the design canvas (390 × 844 reference screen).
export const textStyles = {
  // The word on the card. Each layout style sets its own largest size; see styles.ts word.size.
  word: { size: 50, weight: 800, lineHeight: 1.05, letterSpacing: -0.02 },
  // Big timer's clock.
  bigClock: { size: 92, weight: 800, lineHeight: 0.9, letterSpacing: -0.033, tabular: true },
  // Ombre's light clock.
  clockLight: { size: 30, weight: 400, lineHeight: 1.1, tabular: true },
  // "Next player, ready?", "Clue Giver, ready?"
  headline: { size: 40, weight: 800, lineHeight: 1.1, letterSpacing: -0.02 },
  // How-it-works titles in Reverse and Mind Reader.
  introTitle: { size: 36, weight: 800, lineHeight: 1.1, letterSpacing: -0.022 },
  // The big score on the round-over screen.
  score: { size: 72, weight: 800, lineHeight: 1.05 },
  // Screen titles: Customize, Modes, Send feedback, New game.
  title: { size: 28, weight: 800, lineHeight: 1.2, letterSpacing: -0.018 },
  // Mode name in the Card header and the mode sheet; the Thanks title.
  modeName: { size: 26, weight: 800, lineHeight: 1.15, letterSpacing: -0.019 },
  // Sheet titles: Game paused, Difficulty, Change colors.
  sheetTitle: { size: 24, weight: 800, lineHeight: 1.2 },
  // How to play captions over the dark spotlight.
  caption: { size: 21, weight: 800, lineHeight: 1.25 },
  // How to play intro text under the wordmark.
  lead: { size: 18, weight: 600, lineHeight: 1.45 },
  // Banned-word chips and rows (styles pick their own size; see styles.ts banned.size).
  chip: { size: 18, weight: 500, lineHeight: 1.25 },
  chipSmall: { size: 15, weight: 500, lineHeight: 1.25 },
  // Buttons and option names.
  button: { size: 16, weight: 700, lineHeight: 1.25 },
  buttonStrong: { size: 17, weight: 800, lineHeight: 1.25 },
  optionTitle: { size: 16, weight: 800, lineHeight: 1.25 },
  // Typed text (feedback idea, Mind Reader predictions).
  input: { size: 16, weight: 500, lineHeight: 1.5 },
  link: { size: 15, weight: 700, lineHeight: 1.3 },
  clock: { size: 15, weight: 800, lineHeight: 1.2, tabular: true },
  hint: { size: 14, weight: 500, lineHeight: 1.45 },
  topicChip: { size: 14, weight: 700, lineHeight: 1.25 },
  stats: { size: 14, weight: 600, lineHeight: 1.3 },
  subline: { size: 13, weight: 500, lineHeight: 1.35 },
  label: { size: 13, weight: 600, lineHeight: 1.35 },
  small: { size: 12, weight: 500, lineHeight: 1.4 },
  // Section labels: DON'T SAY, STYLE, COLOR, DIFFICULTY.
  overline: { size: 11, weight: 700, lineHeight: 1.3, letterSpacing: 0.08, uppercase: true },
  // The level badge in the Card header.
  badge: { size: 11, weight: 800, lineHeight: 1.3, letterSpacing: 0.055, uppercase: true },
} as const satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;

// Advance widths of Manrope ExtraBold in em, measured from the font file, for fitWordSize() in
// @unspoken/core. Tracking matches the word style (-0.02em).
const LOWER = [0.583, 0.624, 0.583, 0.625, 0.608, 0.386, 0.624, 0.636, 0.296, 0.301, 0.552, 0.296, 0.916, 0.636, 0.627, 0.624, 0.625, 0.412, 0.547, 0.444, 0.636, 0.568, 0.814, 0.563, 0.57, 0.535];
const UPPER = [0.683, 0.637, 0.746, 0.71, 0.59, 0.53, 0.741, 0.734, 0.296, 0.513, 0.665, 0.541, 0.86, 0.729, 0.758, 0.65, 0.758, 0.67, 0.671, 0.61, 0.726, 0.653, 0.989, 0.672, 0.63, 0.68];
const OTHER: Record<string, number> = { '-': 0.42, "'": 0.28, '’': 0.31, ' ': 0.2, '.': 0.32, ',': 0.32, '&': 0.68, '!': 0.38, '?': 0.57 };

function table(): Record<string, number> {
  const widths: Record<string, number> = { ...OTHER };
  LOWER.forEach((w, i) => (widths[String.fromCharCode(97 + i)] = w));
  UPPER.forEach((w, i) => (widths[String.fromCharCode(65 + i)] = w));
  for (let d = 0; d <= 9; d++) widths[String(d)] = 0.62;
  return widths;
}

export const wordMetrics: GlyphMetrics = {
  widths: table(),
  fallback: 0.7,
  tracking: textStyles.word.letterSpacing,
  wordGap: 0.2,
};
