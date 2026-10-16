'use client';

import type { RegionTone } from '@unspoken/design-tokens';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import styles from './Overlay.module.css';

type OverlayProps = {
  tone: RegionTone;
  // Small caps above the title: PAUSED, PASS THE PHONE, TIME'S UP.
  label: string;
  title: ReactNode;
  // The big number (score or clock) shows larger than a sentence title.
  big?: boolean;
  sub?: ReactNode;
  // A note in the top corner, such as "Timer paused".
  corner?: ReactNode;
  // Buttons; the first gets focus.
  actions: ReactNode;
};

// A full-screen layer over the play screen: Paused, Pass the phone and the end of a round.
export function Overlay({ tone, label, title, big = false, sub, corner, actions }: OverlayProps) {
  const id = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    actionsRef.current?.querySelector<HTMLElement>('button, a')?.focus();
  }, []);
  return (
    <section className={styles.overlay} data-region={tone} role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className={styles.column}>
        <p className={cx(styles.corner, text('label'))}>{corner}</p>
        <div className={styles.center}>
          <p id={id} className={cx(styles.label, text('overline'))}>
            {label}
          </p>
          <h2 className={cx(styles.title, text(big ? 'score' : 'headline'))}>{title}</h2>
          {sub && <p className={cx(styles.sub, text('hint'))}>{sub}</p>}
        </div>
        <div ref={actionsRef} className={styles.actions}>
          {actions}
        </div>
      </div>
    </section>
  );
}
