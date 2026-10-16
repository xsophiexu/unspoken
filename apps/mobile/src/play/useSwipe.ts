import { motion } from '@unspoken/design-tokens';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, type GestureResponderHandlers } from 'react-native';

export type Answer = 'correct' | 'skip';

export type Swipe = {
  // Horizontal drag in px; controls stretch their bars with it.
  dx: Animated.Value;
  // Transform and fade for whatever moves with the card.
  cardStyle: Animated.WithAnimatedObject<object>;
  // 0 to 1 while the "swipe" hint shows.
  hint: Animated.Value;
  panHandlers: GestureResponderHandlers;
  // Fly the card out and then answer (taps on Correct and Skip).
  answer: (kind: Answer) => void;
};

type Options = {
  // Whether the card takes answers right now (core canAnswer for each kind).
  can: (kind: Answer) => boolean;
  onAnswer: (kind: Answer) => void;
  // Paused, a sheet open, round over: no hint, no drag.
  active: boolean;
};

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => live && setReduce(on));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

const { swipe, enter: enterSpring, hint: hintTiming } = motion;
const native = { useNativeDriver: false } as const;

// Swipe right for Correct and left for Skip. The card follows the finger; past the threshold it
// flies off, then the answer is dispatched and the next card springs in. It also nudges right once
// at the start and after an idle spell, to show that it swipes.
export function useSwipe({ can, onAnswer, active }: Options): Swipe {
  const reduceMotion = useReduceMotion();
  const [dx] = useState(() => new Animated.Value(0));
  const [enter] = useState(() => new Animated.Value(1));
  const [fade] = useState(() => new Animated.Value(1));
  const [hint] = useState(() => new Animated.Value(0));
  const flying = useRef(false);
  const hinted = useRef(false);
  const nudge = useRef<Animated.CompositeAnimation | null>(null);
  const [idle, setIdle] = useState(0);
  const latest = useRef({ can, onAnswer, active, reduceMotion });
  useEffect(() => {
    latest.current = { can, onAnswer, active, reduceMotion };
  });

  const stopHint = useCallback(() => {
    hinted.current = true;
    nudge.current?.stop();
    nudge.current = null;
    hint.setValue(0);
  }, [hint]);

  useEffect(() => {
    if (!active || reduceMotion) return;
    const id = setTimeout(
      () => {
        hinted.current = true;
        const seq = Animated.sequence([
          Animated.parallel([
            Animated.timing(dx, { toValue: hintTiming.nudgePx, duration: hintTiming.outMs, easing: Easing.out(Easing.quad), ...native }),
            Animated.timing(hint, { toValue: 1, duration: motion.duration.base, ...native }),
          ]),
          Animated.delay(hintTiming.holdMs),
          Animated.parallel([
            Animated.spring(dx, { toValue: 0, ...native }),
            Animated.timing(hint, { toValue: 0, duration: motion.duration.base, ...native }),
          ]),
        ]);
        nudge.current = seq;
        seq.start(({ finished }) => {
          if (nudge.current !== seq) return;
          nudge.current = null;
          if (finished) setIdle((n) => n + 1);
        });
      },
      hinted.current ? hintTiming.idleMs : hintTiming.firstDelayMs,
    );
    return () => {
      clearTimeout(id);
      if (nudge.current) {
        nudge.current.stop();
        nudge.current = null;
        dx.setValue(0);
      }
      hint.setValue(0);
    };
  }, [active, idle, reduceMotion, dx, hint]);

  const answer = useCallback(
    (kind: Answer) => {
      const { can, onAnswer, active, reduceMotion } = latest.current;
      if (flying.current || !active) return;
      if (!can(kind)) {
        Animated.spring(dx, { toValue: 0, ...native }).start();
        return;
      }
      stopHint();
      setIdle((n) => n + 1);
      if (reduceMotion) {
        dx.setValue(0);
        onAnswer(kind);
        return;
      }
      flying.current = true;
      const dir = kind === 'correct' ? 1 : -1;
      Animated.parallel([
        Animated.timing(dx, { toValue: dir * swipe.flyDistancePx, duration: swipe.flyOutMs, easing: Easing.in(Easing.quad), ...native }),
        Animated.timing(fade, { toValue: 0, duration: swipe.flyOutMs, ...native }),
      ]).start(() => {
        onAnswer(kind);
        dx.setValue(0);
        fade.setValue(1);
        enter.setValue(0);
        Animated.spring(enter, { toValue: 1, friction: enterSpring.friction, tension: enterSpring.tension, ...native }).start(() => {
          flying.current = false;
        });
      });
    },
    [dx, fade, enter, stopHint],
  );

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  });

  // The handlers read refs only when a gesture fires, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        latest.current.active && !flying.current && Math.abs(g.dx) > swipe.startSlopPx && Math.abs(g.dx) > Math.abs(g.dy),
      // Keep the gesture if the browser starts selecting text under the pointer.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        stopHint();
        setIdle((n) => n + 1);
        dx.stopAnimation();
      },
      onPanResponderMove: (_, g) => dx.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > swipe.thresholdPx) answerRef.current('correct');
        else if (g.dx < -swipe.thresholdPx) answerRef.current('skip');
        else Animated.spring(dx, { toValue: 0, ...native }).start();
      },
      onPanResponderTerminate: () => Animated.spring(dx, { toValue: 0, ...native }).start(),
    }),
  );

  const tilt = swipe.tiltAtPx;
  const cardStyle = {
    opacity: Animated.multiply(fade, enter.interpolate({ inputRange: [0, 1], outputRange: [enterSpring.fromOpacity, 1] })),
    transform: [
      { translateX: dx },
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [enterSpring.fromY, 0] }) },
      { rotate: dx.interpolate({ inputRange: [-tilt, 0, tilt], outputRange: [`-${swipe.maxTiltDeg}deg`, '0deg', `${swipe.maxTiltDeg}deg`] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [enterSpring.fromScale, 1] }) },
    ],
  };

  return { dx, cardStyle, hint, panHandlers: pan.panHandlers, answer };
}
