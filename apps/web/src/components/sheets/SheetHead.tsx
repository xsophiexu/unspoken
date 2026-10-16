import type { ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import styles from './sheets.module.css';

// A sheet's title, an optional control beside it, and a note beside or under it. An end control
// sits at the top right, level with the title, and moves the note under the title.
export function SheetHead({ id, title, note, action, end }: { id: string; title: string; note?: string; action?: ReactNode; end?: ReactNode }) {
  return (
    <div className={styles.head}>
      <div className={styles.titleGroup}>
        <h2 id={id} className={text('sheetTitle')}>
          {title}
        </h2>
        {action}
      </div>
      {end}
      {note && <p className={cx(styles.note, end ? styles.noteBelow : undefined, text('small'))}>{note}</p>}
    </div>
  );
}
