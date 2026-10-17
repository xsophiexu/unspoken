'use client';

import { en } from '@unspoken/content';
import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';

import styles from './setup.module.css';
import { useStartMindReader } from './useStartMindReader';

// Mind Reader's start: Quick Play in one tap, a Custom game set up in three steps, or a Practice turn.
export function MindReaderStartScreen() {
  const start = useStartMindReader();
  const s = en.mindReader.start;
  const row = (title: string, body: string) => (
    <>
      <span className={styles.rowText}>
        <span className={text('optionTitle')}>{title}</span>
        <span className={cx(styles.muted, text('small'))}>{body}</span>
      </span>
      <Icon name="chevronRight" className={styles.chevron} />
    </>
  );
  return (
    <Screen tone="base" width="column" back={{ href: routes.modes, label: s.back }} title={en.modes.mindReader.name} sub={s.sub}>
      <button type="button" className={styles.quick} data-region="accent" onClick={() => start('quick')}>
        <span className={styles.rowText}>
          <span className={text('modeName')}>{s.quick.title}</span>
          <span className={cx(styles.muted, text('small'))}>{s.quick.body}</span>
        </span>
        <span className={cx(styles.play, text('button'))}>
          {s.quick.action}
          <Icon name="chevronRight" className={styles.chevron} />
        </span>
      </button>
      <div className={styles.rows}>
        <Link href={routes.mindReaderPlayers} className={styles.row} data-region="raised">
          {row(s.custom.title, s.custom.body)}
        </Link>
        <button type="button" className={styles.row} data-region="raised" onClick={() => start('practice')}>
          {row(s.practice.title, s.practice.body)}
        </button>
      </div>
    </Screen>
  );
}
