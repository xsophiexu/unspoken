import { fitWordSize as fit } from '@unspoken/core';
import { maxWidth, wordMetrics } from '@unspoken/design-tokens';

// The biggest font size, up to max, at which the word fits the width without breaking inside a word.
export function fitWordSize(word: string, width: number, max = 50, min = 22, maxLines = 2): number {
  return fit(word, wordMetrics, { width, max, min, maxLines });
}

// Font size for a difficulty name in a three-column tile grid, so long names like Grandmaster stay on one line.
export function tileNameSize(name: string, screenWidth: number): number {
  const inner = (Math.min(screenWidth, maxWidth.column) - 40) * 0.31 - 24;
  return fitWordSize(name, inner, 16, 11, 1);
}
