import { fitWordSize } from '@unspoken/core';
import { textStyles, wordMetrics, type TextStyleName, type TextStyleToken } from '@unspoken/design-tokens';
import { useCallback, useState } from 'react';
import { PixelRatio, type LayoutChangeEvent } from 'react-native';

// variant: the text style the text renders in, whose letter spacing the estimate uses.
export type FitLimits = { variant: TextStyleName; max: number; min: number; maxLines: number };

// The largest size at which text fits a box, from the shared glyph table (fitWordSize in core).
// The system font scale is taken out first, so the scaled text still fits.
export function fittedSize(text: string, width: number, { variant, max, min, maxLines }: FitLimits): number {
  if (width <= 0) return max;
  const style: TextStyleToken = textStyles[variant];
  const metrics = { ...wordMetrics, tracking: style.letterSpacing ?? 0 };
  return fitWordSize(text, metrics, { width: width / PixelRatio.getFontScale(), max, min, maxLines });
}

// The width of a box, from its layout. Starts at 0 (fitting then keeps the largest size).
export function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width)), []);
  return [width, onLayout];
}
