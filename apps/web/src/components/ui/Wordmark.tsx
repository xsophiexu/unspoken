import { en } from '@unspoken/content';

import { cx, text } from '@/lib/ui';

import styles from './Wordmark.module.css';

// The UnspokenMD wordmark: "unspoken" in ink and "md" in the accent color, in the brand font.
// `tone` picks the colors: on the page, or over How to play's dark spotlight.
export function MdWordmark({ tone, className }: { tone: 'page' | 'spotlight'; className?: string }) {
  const { base, accent } = en.md.wordmark;
  return (
    <p className={cx(styles.wordmark, styles[tone], text('brandWordmark'), className)}>
      {base}
      <span className={styles.accent}>{accent}</span>
    </p>
  );
}
