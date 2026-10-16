import Link from 'next/link';

import { cx, text } from '@/lib/ui';

import { Icon } from './Icon';
import styles from './SuggestCard.module.css';

type SuggestCardProps = {
  title: string;
  body?: string;
  action: string;
  href: string;
  // row: a full-width card under the Modes grid. tile: a dashed tile in the Customize style grid.
  look: 'row' | 'tile';
};

// "Want another mode?" and "Want another style?": a dashed card that opens Send feedback.
export function SuggestCard({ title, body, action, href, look }: SuggestCardProps) {
  return (
    <Link href={href} className={cx(styles.card, styles[look])}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name="bubble" />
      </span>
      <span className={styles.text}>
        <span className={text(look === 'row' ? 'optionTitle' : 'label')}>{title}</span>
        {body && <span className={cx(styles.body, text('small'))}>{body}</span>}
      </span>
      <span className={cx(styles.action, text('label'))}>{action}</span>
    </Link>
  );
}
