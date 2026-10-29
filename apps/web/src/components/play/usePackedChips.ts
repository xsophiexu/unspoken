'use client';

import { packChips } from '@unspoken/core';
import { useLayoutEffect, useState, type RefObject } from 'react';

// Chips that wrap like flex-wrap, reordered onto the fewest lines (packChips in @unspoken/core),
// keeping the order as close to the original as it can: Appendicitis goes from 5 lines to 4.
// Measures the drawn chips (each <li> carries data-index, its place in `words`) and the list's
// width, once per card and again when the width changes, so a resize repacks. Returns the order to
// draw, as indexes into `words`.
export function usePackedChips(ref: RefObject<HTMLElement | null>, words: readonly string[], width: number, enabled: boolean): number[] {
  const key = words.join('\n');
  const [packed, setPacked] = useState<{ key: string; width: number; order: number[] } | null>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!enabled || !list) return;
    const widths = new Array<number>(words.length).fill(0);
    for (const item of Array.from(list.children) as HTMLElement[]) {
      const index = Number(item.dataset.index);
      if (index >= 0 && index < widths.length) widths[index] = item.getBoundingClientRect().width;
    }
    const style = getComputedStyle(list);
    const gap = Number.parseFloat(style.columnGap) || 0;
    // Half a pixel spare, so rounding never lets the packed order wrap where flex-wrap won't.
    const lineWidth = list.getBoundingClientRect().width - SUBPIXEL_SLACK;
    const { order } = packChips(widths, lineWidth, gap);
    setPacked((prev) => (prev && prev.key === key && prev.width === width && same(prev.order, order) ? prev : { key, width, order }));
    // words is read through key: a new array with the same words needs no repack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, key, width, enabled]);

  return enabled && packed?.key === key ? packed.order : words.map((_, i) => i);
}

const SUBPIXEL_SLACK = 0.5;

function same(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((n, i) => n === b[i]);
}
