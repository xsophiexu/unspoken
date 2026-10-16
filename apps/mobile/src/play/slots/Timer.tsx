import { en } from '@unspoken/content';
import { layout, radius, space, textStyles, type RegionColors, type TimerBar as TimerBarSlot, type TimerSlot } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { fittedSize, useWidth } from '../../ui/fit';
import { Icon } from '../../ui/Icon';
import { Press, slopFor } from '../../ui/Press';
import { Txt } from '../../ui/Txt';

export type Clock = { label: string; progress: number };

type ClockProps = { clock: Clock; colors: RegionColors; onPause?: () => void };

export function PauseButton({ colors, onPress, size = layout.control.pause, filled = false, ink }: { colors: RegionColors; onPress?: () => void; size?: number; filled?: boolean; ink?: string }) {
  return (
    <Press
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={en.a11y.pause}
      hitSlop={slopFor(size)}
      style={[styles.round, { width: size, height: size }, filled && { backgroundColor: colors.chip }]}
    >
      <Icon name="pause" size={layout.icon.sm} color={ink ?? (filled ? colors.chipInk : colors.ink)} />
    </Press>
  );
}

// Card: progress runs counterclockwise around the word tile from the left of a gap at the top,
// where the clock sits.
export function TimerRing({ width, height, progress, colors }: { width: number; height: number; progress: number; colors: RegionColors }) {
  const { ringStroke: stroke, ringRadius: r, ringGap: gap } = layout.card;
  const i = stroke / 2;
  const left = width / 2 - gap / 2;
  const right = width / 2 + gap / 2;
  const d = [
    `M${left} ${i}`,
    `H${i + r}`,
    `A${r} ${r} 0 0 0 ${i} ${i + r}`,
    `V${height - i - r}`,
    `A${r} ${r} 0 0 0 ${i + r} ${height - i}`,
    `H${width - i - r}`,
    `A${r} ${r} 0 0 0 ${width - i} ${height - i - r}`,
    `V${i + r}`,
    `A${r} ${r} 0 0 0 ${width - i - r} ${i}`,
    `H${right}`,
  ].join(' ');
  const length = 2 * (left - i - r) + 2 * (height - 2 * i - 2 * r) + (width - 2 * i - 2 * r) + 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(1, progress)) * length;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={d} fill="none" stroke={colors.track} strokeWidth={stroke} strokeLinecap="round" />
      {shown > 0 ? <Path d={d} fill="none" stroke={colors.progress} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${shown} ${length}`} /> : null}
    </Svg>
  );
}

// The clock in the ring's gap, on the page color so the ring stops either side of it.
export function RingClock({ clock, colors, onPause }: ClockProps) {
  return (
    <View style={[styles.ringClock, { backgroundColor: colors.bg, height: layout.control.pause, top: -layout.control.pause / 2 }]}>
      <Txt variant="clock" color={colors.ink} accessibilityLabel={clock.label}>
        {clock.label}
      </Txt>
      <PauseButton colors={colors} onPress={onPause} />
    </View>
  );
}

// The clock and pause in a pill in the header (Deck, Chips).
export function TimerChip({ slot, clock, colors, onPause }: ClockProps & { slot: TimerSlot }) {
  const inverse = slot.fill === 'inverse';
  const ink = inverse ? colors.bg : slot.fill === 'filled' ? colors.chipInk : colors.ink;
  return (
    <View
      style={[
        styles.chip,
        slot.fill === 'outlined' && { borderWidth: layout.stroke.outline, borderColor: colors.outline },
        slot.fill === 'filled' && { backgroundColor: colors.chip },
        inverse && { backgroundColor: colors.ink },
      ]}
    >
      <Txt variant="clock" color={ink}>
        {clock.label}
      </Txt>
      <PauseButton colors={colors} onPress={onPause} ink={ink} size={layout.control.pause - space[0.5]} />
    </View>
  );
}

// A small round progress dial with the clock inside (Ledger, Bottom). Tapping it pauses.
export function TimerDial({ slot, clock, colors, onPause }: ClockProps & { slot: TimerSlot }) {
  const size = slot.size ?? layout.minTouch;
  const stroke = layout.stroke.heavy;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const inner = size - 2 * stroke - space[1];
  const fontSize = fittedSize(clock.label, inner, { max: textStyles.clock.size, min: textStyles.small.size, maxLines: 1 });
  return (
    <Press onPress={onPause} disabled={!onPause} accessibilityLabel={`${clock.label}. ${en.a11y.pause}`} style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        {clock.progress > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.progress}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${clock.progress * length} ${length}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.center}>
        <Txt variant="clock" size={fontSize} color={colors.accentText} numberOfLines={1}>
          {clock.label}
        </Txt>
      </View>
    </Press>
  );
}

// Big timer's huge clock, with the pause button before it. Long labels (Hidden) shrink to fit.
export function BigClock({ slot, clock, colors, onPause }: ClockProps & { slot: TimerSlot }) {
  const [width, onLayout] = useWidth();
  const max = slot.size ?? textStyles.bigClock.size;
  const size = fittedSize(clock.label, width - layout.minTouch - space[3], { max, min: textStyles.title.size, maxLines: 1 });
  return (
    <View style={styles.bigClock} onLayout={onLayout}>
      <PauseButton colors={colors} onPress={onPause} size={layout.minTouch} filled />
      <Txt variant="bigClock" size={size} color={colors.accentText} numberOfLines={1}>
        {clock.label}
      </Txt>
    </View>
  );
}

// The clock beside a bar: at the start or end of its own row, or just the pause button.
export function ClockRow({ slot, clock, colors, onPause }: ClockProps & { slot: TimerSlot }) {
  const at = slot.clockAt ?? 'end';
  const size = slot.size ?? textStyles.clock.size;
  const light = size >= textStyles.clockLight.size;
  return (
    <View style={[styles.clockRow, { justifyContent: at === 'start' ? 'flex-start' : 'flex-end' }]}>
      {at === 'none' ? null : (
        <Txt variant={light ? 'clockLight' : 'clock'} size={size} color={colors.ink}>
          {clock.label}
        </Txt>
      )}
      <PauseButton colors={colors} onPress={onPause} filled={light} />
    </View>
  );
}

// A thin progress line. Bleeding bars run edge to edge with square ends.
export function TimerBar({ bar, progress, colors, bleed = 0 }: { bar: TimerBarSlot; progress: number; colors: RegionColors; bleed?: number }) {
  const round = bar.bleed ? 0 : bar.thickness / 2;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bar, { height: bar.thickness, borderRadius: round, backgroundColor: colors.track }, bar.bleed && { marginHorizontal: -bleed }]}
    >
      <View style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, height: '100%', borderRadius: round, backgroundColor: colors.progress }} />
    </View>
  );
}

// Sheet's bar: the line, then the clock and pause in one row under the word.
export function InlineBar({ slot, clock, colors, onPause }: ClockProps & { slot: TimerSlot }) {
  const bar = slot.bar;
  return (
    <View style={styles.inline}>
      <View style={styles.grow}>{bar ? <TimerBar bar={bar} progress={clock.progress} colors={colors} /> : null}</View>
      <Txt variant="clock" size={slot.size} color={colors.ink}>
        {clock.label}
      </Txt>
      <PauseButton colors={colors} onPress={onPause} filled />
    </View>
  );
}

const styles = StyleSheet.create({
  round: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ringClock: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingLeft: space[2.5],
    paddingRight: space[1.5],
    zIndex: 2,
  },
  chip: {
    height: layout.header.pillHeight,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1.5],
    paddingLeft: space[3.5],
    paddingRight: space[1],
  },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  bigClock: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', gap: space[3] },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  bar: { overflow: 'hidden' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space[2.5] },
  grow: { flex: 1 },
});
