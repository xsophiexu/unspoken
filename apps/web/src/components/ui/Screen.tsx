import type { RegionTone } from '@unspoken/design-tokens';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import styles from './Screen.module.css';

type ScreenProps = {
  // Settings pages sit on canvas; Modes and Setup on the game background.
  tone: RegionTone;
  // How wide the content may grow on a large screen (design-token max widths).
  width: 'column' | 'page' | 'prose';
  back?: { href: string; label: string };
  // Something at the right of the top row (Done, the mode name).
  action?: ReactNode;
  title?: string;
  sub?: string;
  children: ReactNode;
  // A bar pinned to the bottom of the column (the main button).
  footer?: ReactNode;
};

// A full-page screen: centered, capped to a readable width, with the page tone filling the sides.
export function Screen({ tone, width, back, action, title, sub, children, footer }: ScreenProps) {
  return (
    <main className={styles.page} data-region={tone}>
      <div className={cx(styles.column, styles[`w-${width}`])}>
        {(back || action) && (
          <div className={styles.top}>
            {back ? (
              <Link href={back.href} className={cx(styles.link, text('link'))}>
                {back.label}
              </Link>
            ) : (
              <span />
            )}
            {action}
          </div>
        )}
        {title && (
          <header className={styles.header}>
            <h1 className={text('title')}>{title}</h1>
            {sub && <p className={cx(styles.sub, text('hint'))}>{sub}</p>}
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </main>
  );
}

// The accent text link used in top rows (Back, Done).
export function TextLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} className={cx(styles.link, text('link'))} onClick={onClick}>
      {children}
    </Link>
  );
}
