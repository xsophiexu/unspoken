import { describe, expect, it } from 'vitest';
import { fontMetrics, nativeTextStyle, textStyles, type GlyphSet, type TextStyleName, type TextStyleToken } from '../src';

// How far the glyphs overflow a line box of `lineBox` px at `size` px, top and bottom (positive means
// clipped). Browsers and React Native center the font's content box (ascent plus descent) in the
// line box, so the baseline sits half the leftover space below the top of the content box.
function overflow(size: number, lineBox: number, glyphs: GlyphSet) {
  const { contentAscent, contentDescent, ink } = fontMetrics;
  const halfLeading = (lineBox - (contentAscent + contentDescent) * size) / 2;
  const baseline = halfLeading + contentAscent * size;
  return { top: ink[glyphs].ascent * size - baseline, bottom: baseline + ink[glyphs].descent * size - lineBox };
}

function fits(size: number, lineBox: number, glyphs: GlyphSet): boolean {
  const { top, bottom } = overflow(size, lineBox, glyphs);
  return top <= 1e-9 && bottom <= 1e-9;
}

const styles = Object.entries(textStyles) as [TextStyleName, TextStyleToken][];
// Fitted words shrink and big numbers grow, so check every whole size, not only the boards' sizes.
const sizes = Array.from({ length: 113 }, (_, i) => i + 8);

describe('the line box check', () => {
  it('catches the descender clipping seen on web at the boards\' word line height', () => {
    expect(fits(50, 50 * 1.05, 'text')).toBe(false);
    expect(overflow(50, 50 * 1.05, 'text').bottom).toBeGreaterThan(0);
  });

  it('lets digits sit in a tighter line than letters', () => {
    const tightestFor = (glyphs: GlyphSet) => [...Array(200).keys()].map((i) => 0.5 + i / 100).find((ratio) => fits(100, 100 * ratio, glyphs));
    expect(tightestFor('digits')).toBeLessThan(tightestFor('text')!);
  });
});

describe.each(styles)('%s', (name, style) => {
  const glyphs = style.glyphs ?? 'text';

  it('has a line height', () => {
    expect(style.lineHeight).toBeDefined();
  });

  it('keeps its glyphs inside the line box on web (unitless line-height)', () => {
    for (const size of sizes) expect(fits(size, size * style.lineHeight!, glyphs), `${size}px`).toBe(true);
  });

  it('keeps its glyphs inside the line box on native (whole-point lineHeight)', () => {
    for (const size of sizes) {
      const native = nativeTextStyle(name, size);
      expect(fits(size, native.lineHeight!, glyphs), `${size}pt`).toBe(true);
    }
  });
});
