import { describe, expect, it } from 'vitest';

import { blankCellSize, fitWordSize, linesAt, type GlyphMetrics } from '../src';

// A monospace face: every character half an em wide, quarter-em gaps between words.
const mono: GlyphMetrics = { widths: { a: 0.5, b: 0.5, '-': 0.5 }, fallback: 0.5, tracking: 0, wordGap: 0.25 };

describe('fitWordSize', () => {
  it('uses the largest size when a short word fits', () => {
    expect(fitWordSize('Cat', mono, { width: 300 })).toBe(50);
  });

  it('shrinks a long single word until it fits on one line', () => {
    // 20 characters at 0.5em: 10em wide. 300px * 0.97 safety leaves 291px, so 29px is the largest fit.
    const size = fitWordSize('Abcdefghijklmnopqrst', mono, { width: 300 });
    expect(size).toBe(29);
    expect(linesAt('Abcdefghijklmnopqrst', size, 291, mono)).toBe(1);
  });

  it('lets a phrase wrap to two lines before it shrinks', () => {
    // Each word is 5em; together on one line they need 10.25em. At 50px each word fits in 291px.
    expect(fitWordSize('Abcdefghij klmnopqrst', mono, { width: 300 })).toBe(50);
    expect(linesAt('Abcdefghij klmnopqrst', 50, 291, mono)).toBe(2);
  });

  it('shrinks a phrase that would need three lines', () => {
    // Two of the 5em words share a line once 10.25em fits in 291px: 28px.
    const size = fitWordSize('Abcdefghij klmnopqrst uvwxyzabcd', mono, { width: 300 });
    expect(size).toBe(28);
    expect(linesAt('Abcdefghij klmnopqrst uvwxyzabcd', size, 291, mono)).toBe(2);
  });

  it('breaks after hyphens like the browser', () => {
    // As one piece it would be 5.5em (275px) and never fit 250px; broken after the hyphen it takes two lines.
    expect(linesAt('Abcde-fghij', 50, 250, mono)).toBe(2);
  });

  it('keeps a hyphenated word together without a space where it fits', () => {
    // "Abcde-fghij" is 5.5em: at 40px that is 220px, which fits 250px on one line.
    expect(linesAt('Abcde-fghij', 40, 250, mono)).toBe(1);
  });

  it('goes below the minimum to keep a long word inside its box', () => {
    // 30 letters are 15em: 22px would need 330px, so it shrinks to 19px (285px of 291px).
    const word = 'A'.repeat(30);
    const size = fitWordSize(word, mono, { width: 300, min: 22 });
    expect(size).toBe(19);
    expect(linesAt(word, size, 291, mono)).toBe(1);
  });

  it('keeps a long phrase within maxLines by shrinking below the minimum', () => {
    // Five 12-letter words: at 22px two fit a line (269.5px of 291px), so five need 3 lines.
    const phrase = Array.from({ length: 5 }, () => 'A'.repeat(12)).join(' ');
    expect(linesAt(phrase, 22, 291, mono)).toBe(3);
    const size = fitWordSize(phrase, mono, { width: 300, min: 22, maxLines: 2 });
    expect(size).toBeLessThan(22);
    expect(linesAt(phrase, size, 291, mono)).toBeLessThanOrEqual(2);
  });

  it('stops at the floor when even that cannot fit', () => {
    expect(fitWordSize('A'.repeat(200), mono, { width: 100, min: 22 })).toBe(12);
    expect(fitWordSize('A'.repeat(200), mono, { width: 100, min: 22, floor: 16 })).toBe(16);
  });

  it('never sets a floor above the minimum', () => {
    expect(fitWordSize('A'.repeat(200), mono, { width: 100, min: 10, floor: 16 })).toBe(10);
  });

  it('gives a smaller or equal size to a longer word in the same box', () => {
    const sizes = ['Ace', 'Acetone', 'Acetonitrile', 'Acetylcholinesterase'].map((w) => fitWordSize(w, mono, { width: 280 }));
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
  });

  it('gives a larger or equal size in a wider box', () => {
    const word = 'Procrastination';
    expect(fitWordSize(word, mono, { width: 400 })).toBeGreaterThanOrEqual(fitWordSize(word, mono, { width: 300 }));
  });

  it('measures accented letters as their base letter', () => {
    const metrics: GlyphMetrics = { ...mono, widths: { e: 0.2 }, fallback: 1 };
    expect(linesAt('é'.repeat(10), 10, 20, metrics)).toBe(1);
  });
});

describe('blankCellSize', () => {
  it('uses the widest blanks for short words and narrows them for long ones', () => {
    expect(blankCellSize('Cat', { room: 230 })).toBe(30);
    expect(blankCellSize('Wonderful', { room: 230 })).toBe(Math.floor((230 - 6 * 8) / 9));
  });

  it('sizes by the longest word of a phrase and never below the minimum', () => {
    expect(blankCellSize('Big cat', { room: 230 })).toBe(30);
    expect(blankCellSize('A'.repeat(60), { room: 230 })).toBe(12);
  });
});
