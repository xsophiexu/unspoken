import type { ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import styles from './sheets.module.css';

// A sheet's title, an optional control beside it, and a note beside or under it.
export function SheetHead({ id, title, note, action }: { id: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className={styles.head}>
      <div className={styles.titleGroup}>
        <h2 id={id} className={text('sheetTitle')}>
          {title}
        </h2>
        {action}
      </div>
      {note && <p className={cx(styles.note, text('small'))}>{note}</p>}
    </div>
  );
}
