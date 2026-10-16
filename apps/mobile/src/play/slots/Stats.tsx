import { en } from '@unspoken/content';
import { plural, pluralParts, type RoundStats } from '@unspoken/core';
import { radius, space, type RegionColors, type StatsSlot } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Txt, TxtParts } from '../../ui/Txt';

// The score and the rest of the status ("7 pts", "1 skip left") where the style puts them, with
// the score plain, as a big number or in a pill. Modes without a score show only the detail.
export function Stats({ slot, colors, stats }: { slot: StatsSlot; colors: RegionColors; stats: RoundStats }) {
  const points = stats.points === null ? null : <Points emphasis={slot.emphasis} colors={colors} points={stats.points} />;
  const detail = (
    <Txt variant="stats" color={colors.muted} style={styles.shrink}>
      {stats.detail}
    </Txt>
  );
  switch (slot.placement) {
    case 'header':
      return (
        <View style={styles.stacked}>
          {points}
          {detail}
        </View>
      );
    case 'footer':
      return (
        <View style={[styles.row, styles.spread]}>
          {detail}
          {points}
        </View>
      );
    case 'aboveWord':
      return (
        <View style={[styles.row, styles.end]}>
          {detail}
          {points}
        </View>
      );
    default:
      return (
        <View style={styles.row}>
          {points}
          {detail}
        </View>
      );
  }
}

function Points({ emphasis, colors, points }: { emphasis: StatsSlot['emphasis']; colors: RegionColors; points: number }) {
  if (emphasis === 'pill') {
    return (
      <View style={[styles.pill, { backgroundColor: colors.accent }]}>
        <Txt variant="label" color={colors.onAccent}>
          {plural(points, en.units.points)}
        </Txt>
      </View>
    );
  }
  const parts = pluralParts(points, en.units.points);
  return (
    <TxtParts
      variant="stats"
      color={colors.muted}
      parts={parts}
      params={{ n: emphasis === 'bigNumber' ? { variant: 'buttonStrong', color: colors.ink } : { variant: 'stats', color: colors.muted } }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space[4], flexWrap: 'wrap' },
  spread: { justifyContent: 'space-between' },
  end: { justifyContent: 'flex-end' },
  stacked: { alignItems: 'flex-end' },
  shrink: { flexShrink: 1 },
  pill: { borderRadius: radius.lg, paddingHorizontal: space[3], paddingVertical: space[1] },
});
