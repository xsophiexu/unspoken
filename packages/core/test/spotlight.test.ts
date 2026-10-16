import { describe, expect, it } from 'vitest';

import { captionPlacement, tourGesture } from '../src';

// A 390 × 844 phone with the dots at 714, as on the canvas.
const frame = { width: 390, height: 844, floor: 714, side: 32, gap: 16, maxShare: 0.72 };

describe('captionPlacement', () => {
  it('right-aligns a narrow caption under the menu button at the right edge', () => {
    const place = captionPlacement({ x: 312, y: 24, w: 56, h: 56 }, frame);
    expect(place).toMatchObject({ align: 'end', right: 32, top: 96 });
    expect(390 - place.left - place.right).toBeCloseTo(390 * 0.72);
  });

  it('right-aligns the difficulty caption to the badge even near the middle (Card)', () => {
    const place = captionPlacement({ x: 124, y: 29, w: 92, h: 34 }, frame);
    expect(place).toMatchObject({ align: 'end', left: 32, right: 390 - 216, top: 79 });
  });

  it('lines a caption up with a wide target, under it with room below and over it otherwise', () => {
    expect(captionPlacement({ x: 66, y: 198, w: 258, h: 160 }, frame)).toMatchObject({ align: 'start', left: 66, right: 66, top: 374 });
    expect(captionPlacement({ x: 66, y: 464, w: 258, h: 190 }, frame)).toMatchObject({ align: 'start', left: 66, bottom: 844 - 464 + 16 });
  });

  it('keeps a caption over Play above the dots', () => {
    expect(captionPlacement({ x: 26, y: 740, w: 338, h: 72 }, frame)).toMatchObject({ bottom: 844 - 714 + 16 });
  });
});

describe('tourGesture', () => {
  const sizes = { slop: 12, swipe: 44 };
  it('moves forward on a tap or a swipe left or up, back on a swipe right or down', () => {
    expect(tourGesture(2, 3, sizes)).toBe('forward');
    expect(tourGesture(-120, 10, sizes)).toBe('forward');
    expect(tourGesture(5, -120, sizes)).toBe('forward');
    expect(tourGesture(120, 10, sizes)).toBe('back');
    expect(tourGesture(-5, 120, sizes)).toBe('back');
    expect(tourGesture(24, 0, sizes)).toBeNull();
  });
});
