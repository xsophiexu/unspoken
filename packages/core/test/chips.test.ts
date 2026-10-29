import { describe, expect, it } from 'vitest';

import { MAX_PACKED_CHIPS, packChips, packChipTexts, seededRandom } from '../src';

// How flex-wrap lays out chips in a given order: the line count.
function linesFor(widths: readonly number[], order: readonly number[], lineWidth: number, gap: number): number {
  let lines = 0;
  let used = 0;
  for (const i of order) {
    const w = widths[i]!;
    if (lines > 0 && used + gap + w <= lineWidth) used += gap + w;
    else {
      lines += 1;
      used = w;
    }
  }
  return lines;
}

// Pairs of chips shown in the opposite order to the original.
function swaps(order: readonly number[]): number {
  let n = 0;
  for (let a = 0; a < order.length; a++) for (let b = a + 1; b < order.length; b++) if (order[a]! > order[b]!) n++;
  return n;
}

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

// The Appendicitis chips as the Quick Play design draws them, in px, on a 250px card with 8px gaps.
const appendicitis = {
  "McBurney's point": 162,
  'RLQ pain': 87,
  Periumbilical: 128,
  Fecalith: 90,
  'Rebound tenderness': 191,
  'Psoas sign': 111,
} as const;
type Term = keyof typeof appendicitis;
const terms = Object.keys(appendicitis) as Term[];

describe('packChips', () => {
  it('fits Appendicitis on 4 lines instead of 5, with Psoas sign moved up beside Fecalith', () => {
    const widths = terms.map((t) => appendicitis[t]);
    expect(linesFor(widths, [0, 1, 2, 3, 4, 5], 250, 8)).toBe(5);
    const packed = packChipTexts(terms, (t) => appendicitis[t], 250, 8);
    expect(packed.lines).toEqual([["McBurney's point"], ['RLQ pain', 'Periumbilical'], ['Fecalith', 'Psoas sign'], ['Rebound tenderness']]);
  });

  it('keeps the original order when it already uses the fewest lines', () => {
    expect(packChips([50, 50, 50, 50], 110, 10).order).toEqual([0, 1, 2, 3]);
    expect(packChips([90, 90, 90], 100, 10).order).toEqual([0, 1, 2]);
  });

  it('puts everything on one line when it all fits', () => {
    expect(packChips([30, 40, 20], 200, 8)).toEqual({ order: [0, 1, 2], lines: [[0, 1, 2]] });
  });

  it('counts the gap between chips, not after the last one', () => {
    expect(packChips([45, 45], 100, 10).lines).toEqual([[0, 1]]);
    expect(packChips([45, 46], 100, 10).lines).toEqual([[0], [1]]);
  });

  it('gives a chip wider than the line a line of its own and still packs the rest', () => {
    // As is: [300] [50] [100] [50] is 4 lines; the two 50s can share one.
    const packed = packChips([300, 50, 100, 50], 100, 0);
    expect(packed.lines).toHaveLength(3);
    expect(packed.lines).toContainEqual([0]);
  });

  it('handles no chips', () => {
    expect(packChips([], 100, 8)).toEqual({ order: [], lines: [] });
  });

  it('leaves long lists in their order', () => {
    const widths = Array.from({ length: MAX_PACKED_CHIPS + 1 }, (_, i) => (i % 2 ? 60 : 45));
    expect(packChips(widths, 100, 0).order).toEqual(widths.map((_, i) => i));
  });

  it('always finds the fewest lines, then the fewest swaps, matching a search of every order', () => {
    const { random } = seededRandom(2026);
    for (let trial = 0; trial < 150; trial++) {
      const count = 1 + Math.floor(random() * 7);
      const widths = Array.from({ length: count }, () => 20 + Math.floor(random() * 160));
      const lineWidth = 120 + Math.floor(random() * 140);
      const gap = Math.floor(random() * 12);
      const every = permutations(widths.map((_, i) => i));
      const fewest = Math.min(...every.map((o) => linesFor(widths, o, lineWidth, gap)));
      const leastSwaps = Math.min(...every.filter((o) => linesFor(widths, o, lineWidth, gap) === fewest).map(swaps));

      const { order, lines } = packChips(widths, lineWidth, gap);
      expect([...order].sort((a, b) => a - b)).toEqual(widths.map((_, i) => i));
      expect(linesFor(widths, order, lineWidth, gap)).toBe(fewest);
      expect(lines).toHaveLength(fewest);
      expect(lines.flat()).toEqual(order);
      expect(swaps(order)).toBe(leastSwaps);
    }
  });
});
