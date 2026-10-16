import type { ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import styles from './Section.module.css';

type SectionProps = {
  label: string;
  // A hint or status at the right of the label.
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

// A labeled block of a settings screen: DIFFICULTY, THEMES, COLOR…
export function Section({ label, aside, children, className }: SectionProps) {
  return (
    <section className={cx(styles.section, className)}>
      <div className={styles.head}>
        <h2 className={cx(styles.label, text('overline'))}>{label}</h2>
        {aside !== undefined && <span className={cx(styles.aside, text('label'))}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}
