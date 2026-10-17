import { en } from '@unspoken/content';
import {
  clampTimeLimit,
  format,
  formatClock,
  gameConfig,
  isTimeLimitInRange,
  plural,
  sanitizeTimerDigits,
  secondsToTimerDigits,
  stepTimeLimit,
  timerDigitsLabel,
  timerDigitsToSeconds,
} from '@unspoken/core';
import { layout, opacity, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, TextInput, View, type AccessibilityActionEvent } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { Txt } from '../ui/Txt';

export type TimeLimit = { roundSeconds: number; noTimeLimit: boolean };

type Props = {
  visible: boolean;
  onClose: () => void;
  // The time limit the next turn plays.
  value: TimeLimit;
  // This turn's time left, which a change leaves alone; null when this turn has no clock.
  clock: string | null;
  onSave: (value: TimeLimit) => void;
};

const { minRoundSeconds: MIN, maxRoundSeconds: MAX, timeLimitStepSeconds: STEP } = gameConfig;
const LIMITS = { min: formatClock(MIN), max: formatClock(MAX) };
const T = layout.control.timeLimit;

// The big time limit changer on the Paused screen: − and + beside the big time (15 seconds a step),
// the time itself typed like setup's box (digits fill from the right; 1:75 settles as 2:15 once the
// box loses focus), a slider from 0:30 to 10:00, and setup's No limit switch on the title row. A time outside the
// range shows setup's calm note and Save waits until it is fixed.
export function TimeLimitSheet({ visible, onClose, value, clock, onSave }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => <Changer colors={colors} value={value} clock={clock} onClose={onClose} onSave={onSave} />}
    </Sheet>
  );
}

function Changer({ colors, value, clock, onClose, onSave }: Omit<Props, 'visible'> & { colors: RegionColors }) {
  const { theme } = usePrefs();
  const field = theme.regions.raised;
  const s = en.timeLimit;
  const input = useRef<TextInput>(null);
  const [seconds, setSeconds] = useState(value.roundSeconds);
  const [off, setOff] = useState(value.noTimeLimit);
  const [digits, setDigits] = useState(() => secondsToTimerDigits(value.roundSeconds));
  const [focused, setFocused] = useState(false);
  // Once typing stops, a typed 1:75 reads 2:15.
  if (!focused && digits !== secondsToTimerDigits(seconds)) setDigits(secondsToTimerDigits(seconds));

  const inRange = isTimeLimitInRange(seconds);
  const outOfRange = !off && !focused && !inRange;
  const canSave = off || inRange;
  const label = timerDigitsLabel(digits);
  const step = plural(STEP, en.units.seconds);
  const setTime = (next: number) => {
    input.current?.blur();
    setSeconds(next);
    setDigits(secondsToTimerDigits(next));
  };

  return (
    <>
      <SheetHeader
        title={s.title}
        sub={clock ? format(s.keepsClock, { clock }) : s.startsNextTurn}
        colors={colors}
        end={<NoLimitSwitch on={off} colors={colors} knob={field.bg} onChange={setOff} />}
        onClose={onClose}
      />

      <View style={styles.readout}>
        <Stepper icon="minus" label={format(en.a11y.shorter, { step })} colors={colors} disabled={off || seconds <= MIN} onPress={() => setTime(stepTimeLimit(seconds, -1))} />
        <Press
          onPress={() => input.current?.focus()}
          disabled={off}
          fadeDisabled={false}
          accessibilityLabel={format(en.a11y.timer, { clock: label })}
          style={[styles.time, { backgroundColor: off ? colors.disabled : field.bg, borderColor: off ? colors.disabled : focused ? colors.accent : outOfRange ? colors.ink : field.bg }]}
        >
          <Txt variant="score" color={off ? colors.disabledInk : field.ink} style={styles.tabular} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Txt>
        </Press>
        <Stepper icon="plus" label={format(en.a11y.longer, { step })} colors={colors} disabled={off || seconds >= MAX} onPress={() => setTime(stepTimeLimit(seconds, 1))} />
      </View>
      <TextInput
        ref={input}
        value={digits}
        onChangeText={(text) => {
          const next = sanitizeTimerDigits(text);
          setDigits(next);
          setSeconds(timerDigitsToSeconds(next));
        }}
        keyboardType="number-pad"
        editable={!off}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        style={styles.hiddenInput}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      {/* Like setup's box: while No limit is on the time stays, greyed, and keeps for when it goes off. */}
      <Txt variant="small" color={off ? colors.disabledInk : colors.muted} style={styles.center}>
        {off ? en.setup.noClock : en.setup.timerUnit}
      </Txt>

      <Slider seconds={seconds} disabled={off} colors={colors} onChange={setTime} />
      {outOfRange ? <Note text={format(en.setup.timerOutOfRange, LIMITS)} colors={colors} /> : null}


      <Button
        kind="primary"
        label={s.save}
        colors={colors}
        disabled={!canSave}
        style={styles.save}
        onPress={() => onSave({ noTimeLimit: off, roundSeconds: inRange ? seconds : value.roundSeconds })}
      />
    </>
  );
}

// Setup's No limit switch: the short label and a small drawn switch, at the right of the title row.
function NoLimitSwitch({ on, colors, knob, onChange }: { on: boolean; colors: RegionColors; knob: string; onChange: (on: boolean) => void }) {
  return (
    <Press
      onPress={() => onChange(!on)}
      accessibilityRole="switch"
      accessibilityLabel={en.a11y.noTimeLimit}
      accessibilityState={{ checked: on }}
      hitSlop={slopFor(space[4.5])}
      style={styles.noLimit}
    >
      <Txt variant="subline" color={colors.muted}>
        {en.setup.noLimit}
      </Txt>
      {/* Drawn rather than the platform Switch, like setup's, so it looks the same everywhere. */}
      <View style={[styles.track, on ? styles.trackOn : null, { backgroundColor: on ? colors.accent : colors.track }]}>
        <View style={[styles.thumb, { backgroundColor: knob }]} />
      </View>
    </Press>
  );
}

function Stepper({ icon, label, colors, disabled, onPress }: { icon: 'minus' | 'plus'; label: string; colors: RegionColors; disabled: boolean; onPress: () => void }) {
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={slopFor(T.stepper)} style={[styles.stepper, { backgroundColor: colors.chip }]}>
      <Icon name={icon} size={layout.icon.lg} color={colors.chipInk} />
    </Press>
  );
}

// A track from 0:30 to 10:00 with a round thumb: tap or drag anywhere on it; screen readers adjust
// it a step at a time. A typed time outside the range sits the thumb at the nearest end.
function Slider({ seconds, disabled, colors, onChange }: { seconds: number; disabled: boolean; colors: RegionColors; onChange: (seconds: number) => void }) {
  const [width, setWidth] = useState(0);
  // Read inside the pan handlers, which are made once.
  const live = useRef({ width, disabled, onChange, startX: 0 });
  useEffect(() => {
    live.current = { ...live.current, width, disabled, onChange };
  });
  const [pan] = useState(() => {
    const at = (x: number) => {
      const { width: w } = live.current;
      if (w <= 0) return MIN;
      // The thumb's centre runs from half a thumb in from each end.
      const ratio = Math.min(1, Math.max(0, (x - T.thumb / 2) / Math.max(1, w - T.thumb)));
      return clampTimeLimit(MIN + Math.round((ratio * (MAX - MIN)) / STEP) * STEP);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled,
      onMoveShouldSetPanResponder: () => !live.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        live.current.startX = e.nativeEvent.locationX;
        live.current.onChange(at(live.current.startX));
      },
      onPanResponderMove: (_, g) => live.current.onChange(at(live.current.startX + g.dx)),
    });
  });
  const ratio = (clampTimeLimit(seconds) - MIN) / (MAX - MIN);
  const onAction = (e: AccessibilityActionEvent) => {
    if (disabled) return;
    onChange(stepTimeLimit(seconds, e.nativeEvent.actionName === 'increment' ? 1 : -1));
  };
  return (
    <View style={[styles.slider, disabled ? styles.sliderOff : null]}>
      <View
        {...pan.panHandlers}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={en.a11y.timeLimitSlider}
        accessibilityState={{ disabled }}
        accessibilityValue={{ min: MIN, max: MAX, now: clampTimeLimit(seconds), text: formatClock(clampTimeLimit(seconds)) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAction}
        style={styles.sliderHit}
      >
        <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: colors.track }]}>
          <View style={[styles.sliderFill, { width: `${ratio * 100}%`, backgroundColor: colors.accent }]} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.sliderThumb, { left: ratio * Math.max(0, width - T.thumb), backgroundColor: colors.bg, borderColor: colors.accent, opacity: width > 0 ? 1 : 0 }]}
        />
      </View>
      <View style={styles.sliderEnds}>
        <Txt variant="small" color={colors.muted}>
          {LIMITS.min}
        </Txt>
        <Txt variant="small" color={colors.muted}>
          {LIMITS.max}
        </Txt>
      </View>
    </View>
  );
}

// Setup's calm note: muted ink on a soft grey row with a small info icon. Never red.
function Note({ text, colors }: { text: string; colors: RegionColors }) {
  return (
    <View style={[styles.note, { backgroundColor: colors.chip }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="info" size={layout.icon.sm} color={colors.muted} />
      <Txt variant="hint" color={colors.muted} style={styles.noteText}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: space[1] },
  stepper: { width: T.stepper, height: T.stepper, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  time: {
    flex: 1,
    minHeight: layout.control.input.height + space[10],
    borderRadius: radius.lg,
    borderWidth: layout.stroke.focus,
    paddingHorizontal: space[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabular: { fontVariant: ['tabular-nums'], textAlign: 'center' },
  center: { textAlign: 'center' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  slider: { gap: space[1], marginTop: space[2] },
  sliderHit: { height: layout.minTouch, justifyContent: 'center' },
  sliderOff: { opacity: opacity.disabled },
  sliderTrack: { height: T.track, marginHorizontal: T.thumb / 2, borderRadius: radius.pill, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: radius.pill },
  sliderThumb: {
    position: 'absolute',
    top: (layout.minTouch - T.thumb) / 2,
    width: T.thumb,
    height: T.thumb,
    borderRadius: radius.pill,
    borderWidth: layout.stroke.focus,
  },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  note: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderRadius: radius.md, paddingHorizontal: space[3.5], paddingVertical: space[2.5] },
  noteText: { flex: 1 },
  // The No limit switch, the same size as setup's.
  noLimit: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: layout.control.iconBadge },
  track: { width: space[8], height: space[4.5], borderRadius: radius.pill, padding: space[0.5], alignItems: 'flex-start' },
  trackOn: { alignItems: 'flex-end' },
  thumb: { width: space[3.5], height: space[3.5], borderRadius: radius.pill },
  save: { marginTop: space[3] },
});
