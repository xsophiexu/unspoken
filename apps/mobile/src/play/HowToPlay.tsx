import { en } from '@unspoken/content';
import { layout, maxWidth, motion, palettes, radius, space, spotlight, type Theme } from '@unspoken/design-tokens';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Txt';
import { useReduceMotion } from '../ui/useReduceMotion';
import type { Insets } from './PlayView';
import type { Targets } from './spotlight';

type Rect = { x: number; y: number; w: number; h: number };

const { stepMs, moveMs, pulseMs, easing } = motion.spotlight;
const glide = Easing.bezier(...easing);
const KEYS = ['x', 'y', 'w', 'h'] as const;

// How to play, as drawn on the canvas: the play screen under a dark scrim with a cut-out that glides
// from the word to the banned list, the level, the menu and the Play button, one caption per step.
// Steps advance on their own or on a tap; Play ends it.
export function HowToPlay({ targets, theme, insets, onClose }: { targets: Targets; theme: Theme; insets: Insets; onClose: () => void }) {
  const steps = en.howToPlay.steps;
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const reduce = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [box] = useState(() => ({ x: new Animated.Value(width / 2), y: new Animated.Value(height / 2), w: new Animated.Value(0), h: new Animated.Value(0) }));
  const [pulse] = useState(() => new Animated.Value(0));
  // The last step points at the tour's own Play button, as on the canvas.
  const playRef = useRef<View>(null);
  // The top of the dots over Play: captions never reach below it.
  const [floor, setFloor] = useState(Number.POSITIVE_INFINITY);
  const step = steps[index] ?? steps[0];
  const last = index >= steps.length - 1;

  // Measure this step's element and move the cut-out onto it (or close it to a point).
  useEffect(() => {
    let live = true;
    const node = step?.target === 'play' ? playRef.current : step?.target ? targets.get(step.target) : null;
    const go = (r: Rect | null) => {
      if (!live) return;
      setRect(r);
      const p = spotlight.padding;
      const to = r ? { x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p } : { x: width / 2, y: height / 2, w: 0, h: 0 };
      if (reduce) KEYS.forEach((k) => box[k].setValue(to[k]));
      else Animated.parallel(KEYS.map((k) => Animated.timing(box[k], { toValue: to[k], duration: moveMs, easing: glide, useNativeDriver: false }))).start();
    };
    if (node) node.measureInWindow((x, y, w, h) => go(w > 0 && h > 0 ? { x, y, w, h } : null));
    else go(null);
    return () => {
      live = false;
    };
  }, [step, targets, width, height, reduce, box]);

  useEffect(() => {
    if (last) return;
    const id = setTimeout(() => setIndex((i) => i + 1), stepMs);
    return () => clearTimeout(id);
  }, [index, last]);

  useEffect(() => {
    if (reduce) return;
    const half = { duration: pulseMs / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, ...half }), Animated.timing(pulse, { toValue: 0, ...half })]));
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);

  const spread = Math.max(width, height) * 2;
  const below = rect ? rect.y + rect.h / 2 < height / 2 : false;
  const gap = spotlight.padding + space[4];
  const captionPlace = rect ? (below ? { top: rect.y + rect.h + gap } : { bottom: height - Math.min(rect.y, floor) + gap }) : null;
  const playInk = palettes[theme.color].light.accentText;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.cutout,
          {
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            borderWidth: rect ? spotlight.outlineWidth : 0,
            boxShadow: `0px 0px 0px ${spread}px ${spotlight.scrim}`,
          },
        ]}
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} accessible={false} />

      <View pointerEvents="box-none" style={[styles.caption, captionPlace ?? styles.centered]}>
        {!rect && step?.art === 'logo' ? (
          <Txt variant="wordmark" color={spotlight.caption} accessibilityRole="header">
            {en.app.name.toLowerCase()}
          </Txt>
        ) : null}
        {!rect && step?.art === 'mic' ? (
          <View style={styles.mic}>
            <Icon name="mic" size={layout.icon.md} color={spotlight.caption} />
          </View>
        ) : null}
        <Txt
          variant={step?.art === 'logo' ? 'lead' : 'caption'}
          color={step?.art === 'logo' ? spotlight.lead : spotlight.caption}
          style={rect ? undefined : styles.centerText}
          accessibilityLiveRegion="polite"
        >
          {step?.text}
        </Txt>
        {step?.rules ? (
          <View style={styles.rules}>
            {step.rules.map((rule) => (
              <View key={rule} style={styles.rule}>
                <Txt variant="rule" color={spotlight.lead}>
                  {'•'}
                </Txt>
                <Txt variant="rule" color={spotlight.lead} style={styles.ruleText}>
                  {rule}
                </Txt>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.bottom, { paddingBottom: insets.bottom + layout.play.paddingBottom }]}
        onLayout={(e) => setFloor(e.nativeEvent.layout.y)}
      >
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {steps.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, { width: i === index ? spotlight.dot.activeWidth : spotlight.dot.size, backgroundColor: i === index ? spotlight.dot.active : spotlight.dot.color }]}
            />
          ))}
        </View>
        <View ref={playRef} collapsable={false} style={styles.playWrap}>
          <Animated.View pointerEvents="none" style={[styles.pulse, { opacity: pulse }]} />
          <Press onPress={onClose} accessibilityLabel={en.howToPlay.play} style={styles.play}>
            <Icon name="play" size={layout.icon.sm} color={playInk} />
            <Txt variant="buttonStrong" color={playInk}>
              {en.howToPlay.play}
            </Txt>
          </Press>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cutout: { position: 'absolute', borderRadius: spotlight.radius, borderColor: spotlight.outline },
  caption: {
    position: 'absolute',
    left: layout.screen.paddingX,
    right: layout.screen.paddingX,
    alignItems: 'center',
    gap: space[4],
  },
  centered: { top: 0, bottom: 0, justifyContent: 'center' },
  centerText: { textAlign: 'center', maxWidth: maxWidth.prose },
  mic: { width: layout.control.iconBadge, height: layout.control.iconBadge, borderRadius: radius.pill, borderWidth: spotlight.outlineWidth, borderColor: spotlight.outline, alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: space[5], paddingHorizontal: layout.play.paddingX },
  dots: { flexDirection: 'row', gap: space[1.5] },
  dot: { height: spotlight.dot.size, borderRadius: radius.pill },
  playWrap: { width: '100%', maxWidth: maxWidth.column },
  pulse: {
    position: 'absolute',
    top: -spotlight.play.pulseSpread,
    bottom: -spotlight.play.pulseSpread,
    left: -spotlight.play.pulseSpread,
    right: -spotlight.play.pulseSpread,
    borderRadius: spotlight.play.radius + spotlight.play.pulseSpread,
    backgroundColor: spotlight.play.pulse,
  },
  play: {
    minHeight: spotlight.play.height,
    borderRadius: spotlight.play.radius,
    backgroundColor: spotlight.play.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2.5],
  },
  rules: { width: spotlight.rulesWidth, gap: space[0.5] },
  rule: { flexDirection: 'row', gap: space[2] },
  ruleText: { flex: 1 },
});
