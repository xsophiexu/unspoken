import type { CSSProperties, ReactNode } from 'react';

import { cx } from '@/lib/ui';

import styles from './Grid.module.css';

// Equal columns (the counts come from layout.grid in the design tokens).
export function Grid({ columns, children, className, ...rest }: { columns: number; children: ReactNode; className?: string; role?: string; 'aria-label'?: string }) {
  return (
    <div className={cx(styles.grid, className)} style={{ '--columns': columns } as CSSProperties} {...rest}>
      {children}
    </div>
  );
}
