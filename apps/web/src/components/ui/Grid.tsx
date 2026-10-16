import type { CSSProperties, ReactNode } from 'react';

import { cx } from '@/lib/ui';

import styles from './Grid.module.css';

type GridProps = {
  columns: number;
  children: ReactNode;
  className?: string;
  // Every row as tall as the tallest one (the Modes grid), and at least this tall.
  equalRows?: number;
  role?: string;
  'aria-label'?: string;
};

// Equal columns (the counts come from layout.grid in the design tokens).
export function Grid({ columns, children, className, equalRows, ...rest }: GridProps) {
  const vars = { '--columns': columns, ...(equalRows !== undefined && { '--row-min': `${equalRows}px` }) } as CSSProperties;
  return (
    <div className={cx(styles.grid, equalRows !== undefined && styles.equalRows, className)} style={vars} {...rest}>
      {children}
    </div>
  );
}
