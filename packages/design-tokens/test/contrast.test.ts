import { describe, expect, it } from 'vitest';
import {
  AA_NON_TEXT,
  AA_TEXT,
  COLOR_IDS,
  COLOR_MODES,
  ICON_CHIP_TONES,
  REGION_TEXT_PAIRS,
  REGION_TONES,
  STYLE_IDS,
  composite,
  contrastRatio,
  layoutStyleFor,
  opacity,
  palettes,
  readableOn,
  regionColors,
  withAlpha,
  spotlight,
  type LayoutStyle,
  type RegionTone,
} from '../src';

describe('contrast helpers', () => {
  it('rates black on white 21:1 and a color on itself 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    expect(contrastRatio('#3F7470', '#3F7470')).toBeCloseTo(1);
  });

  it('flattens translucent colors onto the background', () => {
    expect(composite('#FFFFFF80', '#000000')).toBe('#808080');
    expect(contrastRatio('#00000000', '#FFFFFF')).toBeCloseTo(1);
  });

  it('leaves text that already reads alone, and moves text that does not just far enough', () => {
    expect(readableOn('#000000', '#FFFFFF')).toBe('#000000');
    const darkened = readableOn('#E07050', '#FFFFFF');
    expect(contrastRatio(darkened, '#FFFFFF')).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(darkened, '#FFFFFF')).toBeLessThan(AA_TEXT + 0.5);
    const lightened = readableOn('#803020', '#101010');
    expect(contrastRatio(lightened, '#101010')).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(lightened, '#101010')).toBeLessThan(AA_TEXT + 0.5);
  });
});

// Coming soon mode tiles on the Modes screen (a base region): the chip (surface) faded to
// opacity.disabled over the page, with a muted title and an accentText pill that both read at AA.
describe.each(COLOR_IDS)('Coming soon tile in %s', (color) => {
  it.each(COLOR_MODES)('fades the chip and keeps its text at AA in %s', (mode) => {
    const colors = palettes[color][mode];
    const region = regionColors(colors, 'base');
    expect(region.disabled).toBe(composite(withAlpha(colors.surface, opacity.disabled), colors.bg));
    expect(contrastRatio(region.disabledInk, region.disabled), 'title').toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(region.disabledAccent, region.disabled), 'pill').toBeGreaterThanOrEqual(AA_TEXT);
  });
});

// Chips in icon-only tones hold an icon, not text, so chipInk on them needs the non-text minimum.
function minimumFor(tone: RegionTone, background: string): number {
  const iconChip = ICON_CHIP_TONES.includes(tone) && (background === 'chip' || background === 'tint');
  return iconChip ? AA_NON_TEXT : AA_TEXT;
}

// Every text slot in every region tone, palette and mode meets WCAG AA for normal text (icons on
// icon-only chips meet AA for non-text).
describe.each(COLOR_IDS)('%s palette', (color) => {
  describe.each(COLOR_MODES)('%s mode', (mode) => {
    const colors = palettes[color][mode];

    it.each(REGION_TONES)('reads on %s regions', (tone) => {
      const region = regionColors(colors, tone);
      for (const [text, background] of REGION_TEXT_PAIRS) {
        // A translucent chip shows the region behind it.
        const bg = composite(region[background], region.bg);
        expect(contrastRatio(region[text], bg), `${text} on ${background}`).toBeGreaterThanOrEqual(minimumFor(tone, background));
      }
    });

    it('reads on every Ombre band', () => {
      for (const band of colors.ramp) expect(contrastRatio(band.ink, band.bg)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('reads How to play captions over the spotlight scrim', () => {
      const behind = composite(spotlight.scrim, colors.surfaceRaised);
      expect(contrastRatio(spotlight.caption, behind)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(spotlight.lead, behind)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  it('reads the Play label (light accentText, in both modes) on the white Play button', () => {
    expect(contrastRatio(palettes[color].light.accentText, spotlight.play.background)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

// Icon-only tones may only color a header row whose chips hold icons: no filled mode label, timer
// chip or score pill sits on their chip fill.
describe('icon-only chips', () => {
  const iconOnly = (tone: RegionTone | undefined) => tone !== undefined && ICON_CHIP_TONES.includes(tone);
  const cases = STYLE_IDS.flatMap((id) => COLOR_MODES.map((mode) => [id, mode, layoutStyleFor(id, mode)] as const));

  it.each(cases)('keeps text off them in %s (%s)', (_id, _mode, style: LayoutStyle) => {
    const { header, ...rest } = style.regions;
    for (const [part, tone] of Object.entries(rest)) expect(iconOnly(tone), `regions.${part}`).toBe(false);
    if (!iconOnly(header)) return;
    expect(style.header.container).not.toBe('filled');
    expect(style.timer.variant === 'chip' && style.timer.fill === 'filled').toBe(false);
    expect(style.stats.placement === 'header' && style.stats.emphasis === 'pill').toBe(false);
  });

  it('are in use, so the rule above is not empty', () => {
    expect(STYLE_IDS.some((id) => COLOR_MODES.some((mode) => iconOnly(layoutStyleFor(id, mode).regions.header)))).toBe(true);
  });
});
