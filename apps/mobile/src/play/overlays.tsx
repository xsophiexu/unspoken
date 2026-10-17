import { en } from '@unspoken/content';
import { format, type RoundSummary } from '@unspoken/core';
import { layout, maxWidth, opacity, radius, space, withAlpha, type RegionColors } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Txt';
import type { Insets } from './PlayView';

// Full-screen states over a swipe round: Paused, Pass the phone (Hot Potato) and Round over.

function Overlay({ colors, insets, see = false, children, footer }: { colors: RegionColors; insets: Insets; see?: boolean; children: ReactNode; footer?: ReactNode }) {
  return (
    <View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        {
          backgroundColor: see ? withAlpha(colors.bg, opacity.overlay) : colors.bg,
          paddingTop: insets.top + layout.screen.paddingTop,
          paddingBottom: insets.bottom + layout.screen.paddingBottom,
        },
      ]}
    >
      <View style={styles.middle}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

// The Change time limit row: the next turn's time limit, and whether it differs from this turn's.
export type TimeLimitRow = { value: string; pending: boolean; onPress: () => void };

type PausedProps = {
  colors: RegionColors;
  insets: Insets;
  clock: string | null;
  status: string;
  // Modes with a visible clock show a Change time limit row above Resume, and the sheet it opens.
  timeLimit?: TimeLimitRow;
  sheet?: ReactNode;
  onResume: () => void;
  onSettings: () => void;
  onNewGame: () => void;
};

export function PausedOverlay({ colors, insets, clock, status, timeLimit, sheet, onResume, onSettings, onNewGame }: PausedProps) {
  return (
    <Overlay colors={colors} insets={insets} see>
      <Txt variant="overline" color={colors.muted}>
        {en.paused.label}
      </Txt>
      {clock ? (
        <Txt variant="score" color={colors.ink}>
          {clock}
        </Txt>
      ) : null}
      <Txt variant="hint" color={colors.muted} style={styles.centerText}>
        {status}
      </Txt>
      <View style={styles.buttons}>
        {timeLimit ? <ChangeTimeLimit row={timeLimit} colors={colors} /> : null}
        <Button kind="primary" label={en.paused.resume} colors={colors} onPress={onResume} />
        <Button label={en.paused.changeSettings} colors={colors} onPress={onSettings} />
        <Button label={en.paused.newGame} colors={colors} onPress={onNewGame} />
      </View>
      {sheet}
    </Overlay>
  );
}

// A quiet row: a timer icon, Change time limit (with "Starts next turn" under it once changed), the
// next turn's time and a chevron.
function ChangeTimeLimit({ row, colors }: { row: TimeLimitRow; colors: RegionColors }) {
  const p = en.paused;
  return (
    <Press
      onPress={row.onPress}
      accessibilityLabel={format(en.a11y.changeTimeLimit, { value: row.value })}
      accessibilityHint={row.pending ? p.startsNextTurn : undefined}
      style={[styles.row, { backgroundColor: colors.chip }]}
    >
      <Icon name="timer" size={layout.icon.md} color={colors.chipInk} />
      <View style={styles.rowText}>
        <Txt variant="optionTitle" color={colors.chipInk}>
          {p.changeTimeLimit}
        </Txt>
        {row.pending ? (
          <Txt variant="subline" color={colors.muted}>
            {p.startsNextTurn}
          </Txt>
        ) : null}
      </View>
      <Txt variant="optionTitle" color={colors.chipInk} style={styles.tabular}>
        {row.value}
      </Txt>
      <Icon name="chevronRight" size={layout.icon.md} color={colors.muted} />
    </Press>
  );
}

export function PassOverlay({ colors, insets, onReady }: { colors: RegionColors; insets: Insets; onReady: () => void }) {
  return (
    <Overlay
      colors={colors}
      insets={insets}
      footer={
        <>
          <Button kind="primary" label={en.pass.ready} colors={colors} onPress={onReady} />
          <Txt variant="small" color={colors.muted} style={styles.centerText}>
            {en.pass.timerPaused}
          </Txt>
        </>
      }
    >
      <View style={[styles.hero, { backgroundColor: colors.chip }]}>
        <Icon name="arrowRight" size={layout.icon.xl} color={colors.accentText} />
      </View>
      <Txt variant="overline" color={colors.muted}>
        {en.pass.label}
      </Txt>
      <Txt variant="headline" color={colors.ink} style={styles.centerText} accessibilityRole="header">
        {en.pass.title}
      </Txt>
    </Overlay>
  );
}

export function OverOverlay({ colors, insets, summary, onPlayAgain, onSettings }: { colors: RegionColors; insets: Insets; summary: RoundSummary; onPlayAgain: () => void; onSettings: () => void }) {
  return (
    <Overlay colors={colors} insets={insets}>
      <Txt variant="overline" color={colors.muted}>
        {summary.label}
      </Txt>
      {summary.value !== null ? (
        <Txt variant="score" color={colors.ink}>
          {summary.value}
        </Txt>
      ) : null}
      {summary.title ? (
        <Txt variant="headline" color={colors.ink} style={styles.centerText}>
          {summary.title}
        </Txt>
      ) : null}
      <Txt variant="hint" color={colors.muted} style={styles.centerText}>
        {summary.sub}
      </Txt>
      <View style={styles.buttons}>
        <Button kind="primary" label={en.over.playAgain} colors={colors} onPress={onPlayAgain} />
        <Button label={en.over.changeSettings} colors={colors} onPress={onSettings} />
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: { paddingHorizontal: layout.screen.paddingX, alignItems: 'center', zIndex: 10 },
  middle: { flex: 1, width: '100%', maxWidth: maxWidth.column, alignItems: 'center', justifyContent: 'center', gap: space[2] },
  footer: { width: '100%', maxWidth: maxWidth.column, gap: space[3] },
  buttons: { alignSelf: 'stretch', gap: space[2.5], marginTop: space[6], paddingHorizontal: space[8] },
  centerText: { textAlign: 'center' },
  row: { minHeight: layout.button.height, borderRadius: radius.xl, paddingHorizontal: space[4], paddingVertical: space[2.5], flexDirection: 'row', alignItems: 'center', gap: space[3], marginBottom: space[2] },
  rowText: { flex: 1, gap: space[0.5] },
  tabular: { fontVariant: ['tabular-nums'] },
  hero: { width: layout.control.heroBadge, height: layout.control.heroBadge, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: space[4] },
});
