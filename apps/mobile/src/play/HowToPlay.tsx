import { en, type SpotlightStep } from '@unspoken/content';
import { captionPlacement, tourGesture, type SpotRect } from '@unspoken/core';
import { layout, maxWidth, motion, palettes, radius, space, spotlight, type Theme } from '@unspoken/design-tokens';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Txt';
import { useReduceMotion } from '../ui/useReduceMotion';
import type { Insets } from './PlayView';
import type { Targets } from './spotlight';

const { moveMs, pulseMs, easing } = motion.spotlight;
const glide = Easing.bezier(...easing);
const KEYS = ['x', 'y', 'w', 'h'] as const;

// The window position of a view, or null before it has a size.
function measure(node: View): Promise<SpotRect | null> {
  return new Promise((resolve) => node.measureInWindow((x, y, w, h) => resolve(w > 0 && h > 0 ? { x, y, w, h } : null)));
}

// How to play, as drawn on the canvas: the play screen under a dark scrim with a cut-out that glides
// from the word to the banned list, the level, the menu and the Play button, one caption per step.
// A tap or a swipe left or up moves forward, a swipe right or down goes back, and Play ends it. Nothing moves on its own.
export function HowToPlay({ targets, theme, insets, onClose }: { targets: Targets; theme: Theme; insets: Insets; onClose: () => void }) {
  const steps = en.howToPlay.steps;
  const [index, setIndex] = useState(0);
  const step: SpotlightStep = steps[index] ?? steps[0]!;
  const forward = () => setIndex((i) => Math.min(steps.length - 1, i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));
  // Where the current touch started: a tap or a swipe left or up moves forward, a swipe right or
  // down goes back.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onRelease = (e: GestureResponderEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const move = tourGesture(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y, { slop: space[3], swipe: layout.minTouch });
    if (move === 'back') back();
    else if (move === 'forward') forward();
  };
  // The cut-out this step points at, in the overlay's coordinates, tagged with its step so a caption
  // is never drawn beside the previous step's cut-out.
  const [placed, setPlaced] = useState<{ id: string; rect: SpotRect | null } | null>(null);
  const reduce = useReduceMotion();
  const win = useWindowDimensions();
  // The overlay's own size; on Android it can differ from the window (edge-to-edge status bar).
  const [frame, setFrame] = useState({ width: win.width, height: win.height });
  const [box] = useState(() => ({ x: new Animated.Value(win.width / 2), y: new Animated.Value(win.height / 2), w: new Animated.Value(0), h: new Animated.Value(0) }));
  const [pulse] = useState(() => new Animated.Value(0));
  const [shown] = useState(() => new Animated.Value(1));
  const rootRef = useRef<View>(null);
  // The last step points at the tour's own Play button, as on the canvas.
  const playRef = useRef<View>(null);
  // Bumped whenever something may have moved: the overlay or a target laid out again.
  const [layoutTick, setLayoutTick] = useState(0);
  // The top of the dots over Play: captions never reach below it.
  const [floor, setFloor] = useState(Number.POSITIVE_INFINITY);

  useEffect(() => targets.listen(() => setLayoutTick((t) => t + 1)), [targets]);

  // Measure this step's element against the overlay itself, not the window: on Android
  // measureInWindow leaves out the status bar while the edge-to-edge overlay starts under it, so
  // window coordinates alone put the cut-out a status bar too high. Both measured the same way, the
  // difference is exact on every platform, safe area and orientation.
  useEffect(() => {
    let live = true;
    const node = step.target === 'play' ? playRef.current : step.target ? targets.get(step.target) : null;
    const root = rootRef.current;
    const go = (r: SpotRect | null) => {
      if (!live) return;
      setPlaced((prev) => (prev?.id === step.id && same(prev.rect, r) ? prev : { id: step.id, rect: r }));
    };
    if (!node || !root) go(null);
    else
      void Promise.all([measure(root), measure(node)]).then(([o, t]) => go(o && t ? { x: t.x - o.x, y: t.y - o.y, w: t.w, h: t.h } : null));
    return () => {
      live = false;
    };
  }, [step, targets, layoutTick, win.width, win.height]);

  const rect = placed?.id === step.id ? placed.rect : null;
  const ready = placed?.id === step.id;

  // A step whose element never reports a size (or whose measurement never comes back) still gets
  // its caption: after one glide it shows in the middle, as for a step with nothing to point at.
  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setPlaced((prev) => (prev?.id === step.id ? prev : { id: step.id, rect: null })), moveMs);
    return () => clearTimeout(id);
  }, [ready, step.id]);

  // Glide the cut-out onto the measured element, or close it to a point.
  useEffect(() => {
    if (!ready) return;
    const p = spotlight.padding;
    const to = rect ? { x: rect.x - p, y: rect.y - p, w: rect.w + 2 * p, h: rect.h + 2 * p } : { x: frame.width / 2, y: frame.height / 2, w: 0, h: 0 };
    if (reduce) {
      KEYS.forEach((k) => box[k].setValue(to[k]));
      return;
    }
    const move = Animated.parallel(KEYS.map((k) => Animated.timing(box[k], { toValue: to[k], duration: moveMs, easing: glide, useNativeDriver: false })));
    move.start();
    return () => move.stop();
  }, [ready, rect, frame, reduce, box]);

  // A new step's caption fades in once its cut-out is in place. The fade runs on the native driver
  // and its view always takes the animated value: switching the same view's opacity between a
  // plain 0 and a JS-driven value on every step left every caption after the first at 0 on Android.
  // Whether the step is measured yet (ready) is a plain opacity on a view around it.
  useEffect(() => {
    if (!ready) return;
    if (reduce) {
      shown.setValue(1);
      return;
    }
    shown.setValue(0);
    const fade = Animated.timing(shown, { toValue: 1, duration: motion.duration.base, delay: moveMs / 2, useNativeDriver: true });
    fade.start();
    return () => fade.stop();
  }, [index, ready, reduce, shown]);

  useEffect(() => {
    if (reduce) return;
    const half = { duration: pulseMs / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, ...half }), Animated.timing(pulse, { toValue: 0, ...half })]));
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);

  const p = spotlight.padding;
  const hole = rect ? { x: rect.x - p, y: rect.y - p, w: rect.w + 2 * p, h: rect.h + 2 * p } : null;
  const place = hole ? captionPlacement(hole, { ...frame, floor, side: layout.play.paddingX, gap: space[4], maxShare: spotlight.captionMaxShare }) : null;
  const spread = Math.max(frame.width, frame.height) * 2;
  const playInk = palettes[theme.color].light.accentText;

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={StyleSheet.absoluteFill}
      accessibilityViewIsModal
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setFrame((f) => (f.width === width && f.height === height ? f : { width, height }));
        setLayoutTick((t) => t + 1);
      }}
    >
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
      {/* Takes every touch over the game: a tap or a swipe left or up moves forward, a swipe right or
          down goes back. Screen
          readers adjust it the same way (swipe up for the next step, down for the previous). */}
      <View
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={en.menu.howToPlay.title}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
        onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'decrement' ? back() : forward())}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        }}
        onResponderRelease={onRelease}
        onResponderTerminate={() => {
          touch.current = null;
        }}
      />

      <View
        pointerEvents="none"
        style={[
          styles.caption,
          place ? { left: place.left, right: place.right, top: place.top, bottom: place.bottom } : styles.centered,
          { opacity: ready ? 1 : 0 },
        ]}
      >
        <Animated.View style={[styles.captionInner, place && { alignItems: place.align === 'end' ? 'flex-end' : 'flex-start' }, { opacity: shown }]}>
          {!hole && step.art === 'logo' ? (
            <Txt variant="wordmark" color={spotlight.caption} accessibilityRole="header">
              {en.app.name.toLowerCase()}
            </Txt>
          ) : null}
          {!hole && step.art === 'mic' ? (
            <View style={styles.mic}>
              <Icon name="mic" size={layout.icon.md} color={spotlight.caption} />
            </View>
          ) : null}
          <Txt
            variant={step.art === 'logo' ? 'lead' : 'caption'}
            color={step.art === 'logo' ? spotlight.lead : spotlight.caption}
            style={[place ? { textAlign: place.align === 'end' ? 'right' : 'left' } : styles.centerText, styles.shadow]}
            accessibilityLiveRegion="polite"
          >
            {step.text}
          </Txt>
          {step.rules ? (
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
        </Animated.View>
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.bottom, { paddingBottom: insets.bottom + layout.play.paddingBottom }]}
        onLayout={(e) => setFloor(e.nativeEvent.layout.y)}
      >
        <View pointerEvents="none" style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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

function same(a: SpotRect | null, b: SpotRect | null) {
  if (!a || !b) return a === b;
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5;
}

const styles = StyleSheet.create({
  cutout: { position: 'absolute', borderRadius: spotlight.radius, borderColor: spotlight.outline },
  caption: {
    position: 'absolute',
    left: layout.screen.paddingX,
    right: layout.screen.paddingX,
  },
  captionInner: { alignItems: 'center', gap: space[4] },
  centered: { top: 0, bottom: 0, justifyContent: 'center' },
  centerText: { textAlign: 'center', maxWidth: maxWidth.prose },
  shadow: { textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
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
