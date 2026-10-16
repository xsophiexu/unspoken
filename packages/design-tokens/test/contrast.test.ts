import { describe, expect, it } from 'vitest';
import {
  AA_TEXT,
  COLOR_IDS,
  COLOR_MODES,
  REGION_TEXT_PAIRS,
  REGION_TONES,
  composite,
  contrastRatio,
  palettes,
  regionColors,
  spotlight,
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
});

// Every text slot in every region tone, palette and mode meets WCAG AA for normal text.
describe.each(COLOR_IDS)('%s palette', (color) => {
  describe.each(COLOR_MODES)('%s mode', (mode) => {
    const colors = palettes[color][mode];

    it.each(REGION_TONES)('reads on %s regions', (tone) => {
      const region = regionColors(colors, tone);
      for (const [text, background] of REGION_TEXT_PAIRS) {
        // A translucent chip shows the region behind it.
        const bg = composite(region[background], region.bg);
        expect(contrastRatio(region[text], bg), `${text} on ${background}`).toBeGreaterThanOrEqual(AA_TEXT);
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
