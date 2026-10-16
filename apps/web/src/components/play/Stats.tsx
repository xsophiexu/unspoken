import { en } from '@unspoken/content';
import { plural, type RoundStats } from '@unspoken/core';
import type { StatsSlot } from '@unspoken/design-tokens';

import { cx, splitNumber, text } from '@/lib/ui';

import styles from './Stats.module.css';

type StatsProps = {
  slot: StatsSlot;
  at: StatsSlot['placement'];
  stats: RoundStats;
};

// The score and the rest of the status line ("7 pts", "1 skip left"), placed and weighted per style.
// Styles with stats in the subline show them in the header instead.
export function Stats({ slot, at, stats }: StatsProps) {
  if (slot.placement !== at || at === 'subline') return null;
  return (
    <p className={cx(styles.stats, styles[at], text('stats'))}>
      {stats.points !== null && <Points points={stats.points} emphasis={slot.emphasis} />}
      <span className={styles.detail}>{stats.detail}</span>
    </p>
  );
}

function Points({ points, emphasis }: { points: number; emphasis: StatsSlot['emphasis'] }) {
  const phrase = plural(points, en.units.points);
  if (emphasis === 'pill') return <span className={cx(styles.pill, text('label'))}>{phrase}</span>;
  if (emphasis === 'plain') return <span className={styles.points}>{phrase}</span>;
  const { before, number, after } = splitNumber(phrase, points);
  return (
    <span className={styles.points}>
      {before}
      <b className={styles.number}>{number}</b>
      {after}
    </span>
  );
}
