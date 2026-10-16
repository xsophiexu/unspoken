import { en } from '@unspoken/content';
import { layout, motion, opacity, radius, space, type ControlsSlot, type RegionColors, type Theme } from '@unspoken/design-tokens';
import { Animated, StyleSheet, View } from 'react-native';

import { Icon } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { Txt } from '../../ui/Txt';
import { Target } from '../spotlight';
import type { Answer } from '../useSwipe';

// The words on the controls. Reverse uses its own ("← Missed", "Got it →").
export type ControlLabels = { skip: string; correct: string; skipLink: string; correctLink: string };

export const swipeLabels: ControlLabels = { skip: en.play.skip, correct: en.play.correct, skipLink: en.play.skipLink, correctLink: en.play.correctLink };

type Props = {
  slot: ControlsSlot;
  colors: RegionColors;
  // splitBar halves, in the style's skip and correct region tones.
  halves: { skip: RegionColors; correct: RegionColors };
  labels?: ControlLabels;
  canSkip: boolean;
  canCorrect: boolean;
  onAnswer?: (kind: Answer) => void;
  // The card's drag, which swipe links stretch with.
  dx?: Animated.Value;
  // splitBar runs down through the bottom safe area.
  bottomInset?: number;
};

// splitBar halves in the style's skip and correct tones, or the surrounding colors.
export function halvesFor(theme: Theme, colors: RegionColors) {
  const { skip, correct } = theme.style.regions;
  return { skip: skip ? theme.regions[skip] : colors, correct: correct ? theme.regions[correct] : colors };
}

// Whether the controls reach the bottom edge themselves (and fill the safe area).
export const fillsBottom = (slot: ControlsSlot) => slot.variant === 'splitBar';

const still = new Animated.Value(0);

// Skip and Correct, in the style's variant. Both are always tappable buttons; swiping the card does
// the same.
export function Controls({ labels = swipeLabels, onAnswer, dx = still, ...props }: Props) {
  const press = (kind: Answer) => (onAnswer ? () => onAnswer(kind) : undefined);
  const parts: Parts = { ...props, labels, onSkip: press('skip'), onCorrect: press('correct'), dx };
  return <Target name="play">{body(parts)}</Target>;
}

type Parts = Omit<Props, 'labels' | 'onAnswer' | 'dx'> & { labels: ControlLabels; onSkip?: () => void; onCorrect?: () => void; dx: Animated.Value };

function body(p: Parts) {
  switch (p.slot.variant) {
    case 'swipeLinks':
      return p.slot.hint === 'bars' ? <SwipeBars {...p} /> : <SwipeLinks {...p} />;
    case 'pills':
      return <Pills {...p} />;
    case 'buttons':
      return <Buttons {...p} />;
    case 'splitBar':
      return <SplitBar {...p} />;
  }
}

// Card: "← Skip" and "Correct →" over two bars; the side the card heads to stretches.
function SwipeBars({ slot, colors, labels, canSkip, canCorrect, onSkip, onCorrect, dx }: Parts) {
  const [s, c] = slot.ratio ?? [1, 1];
  const { thresholdPx: at, barShrink, barGrow, startSlopPx } = motion.swipe;
  const clamp = { extrapolate: 'clamp' } as const;
  const skipFlex = dx.interpolate({ inputRange: [-at, 0, at], outputRange: [s * barGrow, s, s * barShrink], ...clamp });
  const correctFlex = dx.interpolate({ inputRange: [-at, 0, at], outputRange: [c * barShrink, c, c * barGrow], ...clamp });
  const skipFade = dx.interpolate({ inputRange: [0, at], outputRange: [1, opacity.disabled], ...clamp });
  const correctFade = dx.interpolate({ inputRange: [-at, 0], outputRange: [opacity.disabled, 1], ...clamp });
  const skipBar = dx.interpolate({ inputRange: [-startSlopPx, 0], outputRange: [colors.outline, colors.track], ...clamp });
  return (
    <View style={[styles.row, { height: slot.height }]}>
      <Animated.View style={{ flex: skipFlex }}>
        <Press onPress={onSkip} disabled={!canSkip} accessibilityLabel={labels.skip} style={styles.barColumn}>
          <Animated.View style={{ opacity: skipFade }}>
            <Txt variant="link" color={colors.muted} numberOfLines={1}>
              {labels.skipLink}
            </Txt>
          </Animated.View>
          <Animated.View style={[styles.bar, { backgroundColor: skipBar }]} />
        </Press>
      </Animated.View>
      <Animated.View style={{ flex: correctFlex }}>
        <Press onPress={onCorrect} disabled={!canCorrect} accessibilityLabel={labels.correct} style={[styles.barColumn, styles.end]}>
          <Animated.View style={{ opacity: correctFade }}>
            <Txt variant="link" color={colors.accentText} numberOfLines={1}>
              {labels.correctLink}
            </Txt>
          </Animated.View>
          <View style={[styles.bar, { backgroundColor: colors.progress }]} />
        </Press>
      </Animated.View>
    </View>
  );
}

// Deck: the same links with "swipe the card" between them.
function SwipeLinks({ slot, colors, labels, canSkip, canCorrect, onSkip, onCorrect }: Parts) {
  return (
    <View style={[styles.row, styles.center, { height: slot.height }]}>
      <Press onPress={onSkip} disabled={!canSkip} accessibilityLabel={labels.skip} style={styles.link}>
        <Txt variant="link" color={colors.muted} numberOfLines={1}>
          {labels.skipLink}
        </Txt>
      </Press>
      <Txt variant="small" color={colors.muted} numberOfLines={1} style={styles.hint}>
        {en.play.swipeTheCard}
      </Txt>
      <Press onPress={onCorrect} disabled={!canCorrect} accessibilityLabel={labels.correct} style={[styles.link, styles.end]}>
        <Txt variant="link" color={colors.accentText} numberOfLines={1}>
          {labels.correctLink}
        </Txt>
      </Press>
    </View>
  );
}

function CorrectButton({ slot, colors, labels, canCorrect, onCorrect, height, flex = 1 }: Parts & { height: number; flex?: number }) {
  return (
    <Press
      onPress={onCorrect}
      disabled={!canCorrect}
      accessibilityLabel={labels.correct}
      style={[styles.button, { flex, height, borderRadius: radius[slot.radius], backgroundColor: colors.accent }]}
    >
      {slot.correctIcon ? <Icon name="check" size={layout.icon.md} color={colors.onAccent} /> : null}
      <Txt variant="buttonStrong" color={colors.onAccent} numberOfLines={1}>
        {labels.correct}
      </Txt>
    </Press>
  );
}

// Lines, Ledger, Bottom: an outlined Skip beside a wide pill Correct, as tall as Correct. Skip is a
// circle with the word (round), a pill with an arrow and the word (pillIcon) or a button.
function Pills(p: Parts) {
  const { slot, colors, labels, canSkip, onSkip } = p;
  const round = slot.skip === 'round';
  const icon = slot.skip === 'pillIcon';
  return (
    <View style={[styles.row, { height: slot.height }]}>
      <Press
        onPress={onSkip}
        disabled={!canSkip}
        accessibilityLabel={labels.skip}
        style={[
          styles.button,
          { height: slot.height, borderWidth: layout.stroke.outline, borderColor: colors.outline, borderRadius: icon ? radius.pill : radius[slot.radius] },
          round ? { width: slot.height, paddingHorizontal: 0 } : { width: slot.skipWidth },
        ]}
      >
        {icon ? <Icon name="arrowRight" size={layout.icon.lg} color={colors.ink} /> : null}
        <Txt variant={round ? 'label' : 'button'} color={colors.ink} numberOfLines={1}>
          {labels.skip}
        </Txt>
      </Press>
      <CorrectButton {...p} height={slot.height} />
    </View>
  );
}

// Ink, Sheet, Big timer, Ombre: two rounded buttons sharing the row.
function Buttons(p: Parts) {
  const { slot, colors, labels, canSkip, onSkip } = p;
  const [s, c] = slot.ratio ?? [1, 1];
  const filled = slot.skip === 'filled';
  return (
    <View style={[styles.row, { height: slot.height }]}>
      <Press
        onPress={onSkip}
        disabled={!canSkip}
        accessibilityLabel={labels.skip}
        style={[
          styles.button,
          { height: slot.height, borderRadius: radius[slot.radius] },
          slot.skipWidth ? { width: slot.skipWidth } : { flex: s },
          filled ? { backgroundColor: colors.chip } : { borderWidth: layout.stroke.outline, borderColor: colors.outline },
        ]}
      >
        <Txt variant="button" color={filled ? colors.chipInk : colors.ink} numberOfLines={1}>
          {labels.skip}
        </Txt>
      </Press>
      <CorrectButton {...p} height={slot.height} flex={slot.skipWidth ? 1 : c} />
    </View>
  );
}

// Split, Chips: a full-width bar split into Skip and Correct, down to the bottom edge. A fixed Skip
// width keeps its share of the reference screen at any width. The labels center above the slot's
// bottom padding (clear of rounded screen corners) and the bottom safe area.
function SplitBar({ slot, halves, labels, canSkip, canCorrect, onSkip, onCorrect, bottomInset = 0 }: Parts) {
  const skipShare = slot.skipWidth ?? layout.referenceScreen.width / 2;
  const under = (slot.paddingBottom ?? 0) + bottomInset;
  const half = (colors: RegionColors, label: string, can: boolean, onPress: (() => void) | undefined, size: object) => (
    <Press onPress={onPress} disabled={!can} accessibilityLabel={label} style={[styles.half, size, { backgroundColor: colors.bg, paddingBottom: under }]}>
      <Txt variant="buttonStrong" color={colors.ink} numberOfLines={1}>
        {label}
      </Txt>
    </Press>
  );
  return (
    <View style={[styles.split, { height: slot.height + bottomInset }]}>
      {half(halves.skip, labels.skip, canSkip, onSkip, { flex: skipShare })}
      {half(halves.correct, labels.correct, canCorrect, onCorrect, { flex: layout.referenceScreen.width - skipShare })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2.5] },
  center: { justifyContent: 'space-between' },
  end: { alignItems: 'flex-end' },
  grow: { flex: 1 },
  barColumn: { height: '100%', justifyContent: 'space-between', paddingTop: space[1] },
  bar: { height: layout.control.swipeBar, borderRadius: radius.pill, alignSelf: 'stretch' },
  link: { minHeight: layout.minTouch, justifyContent: 'center', flexShrink: 0 },
  hint: { flexShrink: 1, textAlign: 'center' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], paddingHorizontal: space[3] },
  split: { flexDirection: 'row' },
  half: { alignItems: 'center', justifyContent: 'center' },
});
