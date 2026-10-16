import Link from 'next/link';

import { cx, text } from '@/lib/ui';

import { Icon } from './Icon';
import styles from './MenuRow.module.css';

type MenuRowProps = {
  title: string;
  detail?: string;
  href?: string;
  onClick?: () => void;
};

// A row in a menu sheet: title, a line of detail, and a chevron when it opens another screen.
export function MenuRow({ title, detail, href, onClick }: MenuRowProps) {
  const content = (
    <>
      <span className={styles.text}>
        <span className={text('optionTitle')}>{title}</span>
        {detail && <span className={cx(styles.detail, text('small'))}>{detail}</span>}
      </span>
      {href && <Icon name="chevronRight" className={styles.chevron} />}
    </>
  );
  return href ? (
    <Link href={href} className={styles.row} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button type="button" className={styles.row} onClick={onClick}>
      {content}
    </button>
  );
}
