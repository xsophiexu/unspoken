import { cx, text } from '@/lib/ui';

import styles from './sheets.module.css';

// A sheet's title with a note beside or under it.
export function SheetHead({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className={styles.head}>
      <h2 id={id} className={text('sheetTitle')}>
        {title}
      </h2>
      {note && <p className={cx(styles.note, text('small'))}>{note}</p>}
    </div>
  );
}
