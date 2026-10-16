'use client';

import { fitWordSize } from '@unspoken/core';
import { wordMetrics } from '@unspoken/design-tokens';
import { useRef, type CSSProperties } from 'react';

import { useElementSize } from '@/lib/hooks';
import { cx, referenceContentWidth } from '@/lib/ui';

import styles from './FittedText.module.css';

type FittedTextProps = {
  text: string;
  max: number;
  min: number;
  maxLines?: number;
  // The box width when the caller already knows it; otherwise the element measures itself.
  width?: number;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'p';
  className?: string;
  style?: CSSProperties;
};

// Text at the largest size that fits its box without breaking inside a word (fitWordSize from
// @unspoken/core with the design tokens' glyph widths). Phrases wrap to maxLines before shrinking.
export function FittedText({ text, max, min, maxLines = 1, width, as: Tag = 'span', className, style }: FittedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const measured = useElementSize(ref, { width: referenceContentWidth, height: 0 }).width;
  const size = fitWordSize(text, wordMetrics, { width: width ?? measured, max, min, maxLines });
  return (
    <Tag ref={ref as never} className={cx(styles.fitted, className)} style={{ ...style, fontSize: size }}>
      {text}
    </Tag>
  );
}
