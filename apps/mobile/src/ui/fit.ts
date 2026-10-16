import { fitWordSize } from '@unspoken/core';
import { wordMetrics } from '@unspoken/design-tokens';
import { useCallback, useState } from 'react';
import { PixelRatio, type LayoutChangeEvent } from 'react-native';

export type FitLimits = { max: number; min: number; maxLines: number };

// The largest size at which text fits a box, from the shared glyph table (fitWordSize in core).
// The system font scale is taken out first, so the scaled text still fits.
export function fittedSize(text: string, width: number, { max, min, maxLines }: FitLimits): number {
  if (width <= 0) return max;
  return fitWordSize(text, wordMetrics, { width: width / PixelRatio.getFontScale(), max, min, maxLines });
}

// The width of a box, from its layout. Starts at 0 (fitting then keeps the largest size).
export function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width)), []);
  return [width, onLayout];
}
