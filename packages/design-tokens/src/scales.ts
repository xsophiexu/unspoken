// Sizes, motion and responsive rules shared by every style. Numbers are px on web and dp on native.

// Spacing on a 2px grid; keys follow the familiar 4px unit (1 = 4px, 0.5 = 2px).
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18,
  5: 20,
  5.5: 22,
  6: 24,
  6.5: 26,
  7: 28,
  7.5: 30,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

export const radius = {
  none: 0,
  // Level badge, Chips-style banned words.
  xs: 6,
  // Banned-word chips, Lines-style menu button.
  sm: 10,
  // Inputs, sheet buttons.
  md: 12,
  // Difficulty tiles, Big timer buttons.
  lg: 14,
  // Option tiles, primary buttons, menu rows.
  xl: 16,
  // Primary buttons on feedback screens, the How to play Play button.
  xxl: 18,
  // The Card word tile.
  card: 20,
  // The spotlight cut-out.
  spotlight: 22,
  // The Deck card and Reverse/Mind Reader cards.
  cardLarge: 26,
  // Bottom sheets and panels with a rounded top.
  sheet: 28,
  // The timer ring's corners.
  ring: 30,
  pill: 999,
} as const;
export type RadiusName = keyof typeof radius;

// Box shadows in CSS syntax, which React Native's boxShadow style also accepts.
export const elevation = {
  light: {
    none: 'none',
    // Thumbnails on Customize.
    thumb: '0px 1px 4px 0px rgba(0, 0, 0, 0.12)',
    // Stacked cards and small raised controls.
    raised: '0px 2px 6px 0px rgba(30, 50, 50, 0.10)',
    // The Deck card.
    card: '0px 18px 40px 0px rgba(30, 50, 50, 0.14), 0px 2px 6px 0px rgba(30, 50, 50, 0.06)',
  },
  dark: {
    none: 'none',
    thumb: '0px 1px 4px 0px rgba(0, 0, 0, 0.40)',
    raised: '0px 2px 6px 0px rgba(0, 0, 0, 0.35)',
    card: '0px 18px 40px 0px rgba(0, 0, 0, 0.45), 0px 2px 6px 0px rgba(0, 0, 0, 0.30)',
  },
} as const;

export const motion = {
  duration: { fast: 150, base: 200, slow: 320 },
  // The card follows the finger; past the threshold it flies off and the answer is dispatched.
  // barShrink and barGrow: how far the Skip and Correct bars shrink and grow (as flex factors) at the
  // threshold, so the side the card is heading to stretches with the drag.
  swipe: { thresholdPx: 100, flyOutMs: 260, flyDistancePx: 520, maxTiltDeg: 10, tiltAtPx: 180, startSlopPx: 6, barShrink: 0.3, barGrow: 3.2 },
  // The next card springs in.
  enter: { friction: 9, tension: 70, fromY: 40, fromScale: 0.95, fromOpacity: 0.3 },
  // The card nudges right to show it swipes: once at the start, then after 30 idle seconds.
  hint: { firstDelayMs: 600, idleMs: 30_000, nudgePx: 70, outMs: 320, holdMs: 780 },
  // How to play: seven steps of three seconds; the spotlight glides between targets.
  spotlight: { stepMs: 3000, moveMs: 630, easing: [0.5, 0, 0.3, 1] as const, pulseMs: 2000 },
} as const;

// Window widths where layouts change. Below medium is a phone; the game always fits a phone column.
export const breakpoints = { compact: 0, medium: 600, expanded: 1024 } as const;

// Content never stretches across a wide screen.
export const maxWidth = {
  // The game column (play screen, setup, modes). Wider screens center it and fill the sides with bg.
  column: 480,
  // Bottom sheets and menus.
  sheet: 480,
  // Full-page forms: Customize, Send feedback.
  page: 560,
  // Paragraphs such as the Thanks text.
  prose: 420,
} as const;

// Layout constants measured from the boards.
export const layout = {
  // The boards are drawn at this size; thumbnails scale a full screen down from it.
  referenceScreen: { width: 390, height: 844 },
  screen: { paddingX: 20, paddingTop: 18, paddingBottom: 24 },
  minTouch: 44,
  // caretScale: the ▾ after the mode and level, relative to the header text size.
  header: { menuButton: 36, pillHeight: 40, badgeRadius: radius.xs, caretScale: 0.62 },
  // Card style: the word tile inside the timer ring.
  card: { maxWidth: 350, maxHeight: 580, ringStroke: 8, ringRadius: radius.ring, ringGap: 108, ringInset: 18, paddingX: 22, paddingY: 30 },
  chip: { paddingX: 15, paddingY: 11, gap: 8, compactPaddingX: 11, compactPaddingY: 8 },
  // Banned lists switch to compact sizes from this many words (Escalate climbs to 10).
  banned: { compactFrom: 7 },
  sheet: { radius: radius.sheet, grabberWidth: 40, grabberHeight: 5, paddingX: 20, paddingTop: 10, paddingBottom: 26 },
  button: { height: 54, primaryHeight: 58, radius: radius.xl },
  // Grid columns on each screen.
  grid: { modes: 2, setupDifficulty: 3, sheetDifficulty: 4, skips: 6, customizeColumns: 3, customizeRows: 3 },
  // Customize shows each style as a live miniature of the play screen.
  thumbnail: { scale: 0.235, radius: radius.md },
  swatch: { size: 28, ring: 2, gap: 3 },
  // Icon boxes and line weights for the controls the boards draw.
  icon: { sm: 14, md: 18, lg: 22, xl: 24 },
  stroke: { hairline: 1, outline: 1.5, focus: 2, heavy: 4 },
  control: {
    // The round pause button beside a clock (the ring's gap label is the same height).
    pause: 32,
    // Swipe bars under "← Skip" and "Correct →".
    swipeBar: 6,
    segmented: { height: 36, inset: 4 },
    // Mode tiles on Modes; level tiles on the mode and difficulty sheet.
    modeTile: 92,
    levelTile: 52,
    input: { height: 48, multilineHeight: 160 },
    // Round icon holders: the suggest card's bubble, step numbers, the Thanks check.
    iconBadge: 36,
    stepNumber: 30,
    heroBadge: 72,
  },
} as const;

// Feedback for pressed and unavailable controls, and the page color behind the Paused overlay.
export const opacity = { pressed: 0.8, disabled: 0.45, overlay: 0.94 } as const;

// The How to play walkthrough ("Dark spotlight, white captions", option A). Colors are fixed so the
// overlay reads the same over every style, color and mode. The Play label is the color's light-mode
// accentText in both modes.
// Colors are #RRGGBBAA.
export const spotlight = {
  scrim: '#0E1818B8',
  outline: '#FFFFFFD9',
  outlineWidth: 2,
  radius: radius.spotlight,
  caption: '#FFFFFF',
  captionShadow: '0px 1px 8px rgba(0, 0, 0, 0.25)',
  lead: '#FFFFFFE6',
  dot: { size: 6, activeWidth: 18, color: '#FFFFFF59', active: '#FFFFFF' },
  play: { background: '#FFFFFF', height: 60, radius: radius.xxl, pulse: '#FFFFFF80', pulseSpread: 10 },
  // Inset of the cut-out around its target.
  padding: 6,
} as const;
