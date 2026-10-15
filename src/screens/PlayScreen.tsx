import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GameMenu } from '../components/GameMenu';
import { TimerRing } from '../components/TimerRing';
import { cardsFor, difficultyOf, formatClock, modeOf, shuffled } from '../game';
import { font, type Theme } from '../theme';
import type { Card, GameSettings, ModeId } from '../types';

type Props = {
  settings: GameSettings;
  theme: Theme;
  onRestart: () => void;
  onChangeSettings: () => void;
  onChangeMode: (mode: ModeId) => void;
  onChangeTheme: (index: number) => void;
};

const MAX_W = 350;
const MAX_H = 580;
const SWIPE_AT = 100;

// The Current Version screen from the design canvas: a swipeable card inside a timer ring.
export function PlayScreen({ settings, theme: t, onRestart, onChangeSettings, onChangeMode, onChangeTheme }: Props) {
  const mode = modeOf(settings.mode);
  const difficulty = difficultyOf(settings.difficulty);
  const pool = useMemo(() => cardsFor(settings.difficulty, settings.category), [settings.difficulty, settings.category]);

  const [deck, setDeck] = useState<Card[]>(() => shuffled(pool));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [total, setTotal] = useState(settings.roundSeconds);
  const [left, setLeft] = useState(settings.roundSeconds);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [area, setArea] = useState({ w: MAX_W, h: MAX_H });

  const over = mode.timed && left <= 0;
  const running = mode.timed && !paused && !menuOpen && !over;
  const skipsLeft = settings.skips === null ? null : Math.max(0, settings.skips - skipsUsed);
  const card = deck[idx];

  const dx = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const hint = useRef(new Animated.Value(0)).current;
  const flying = useRef(false);
  const swiped = useRef(false);
  const nudge = useRef<Animated.CompositeAnimation | null>(null);

  // Clock.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Until the first swipe, nudge the card right every few seconds to show it moves.
  useEffect(() => {
    if (swiped.current || paused || menuOpen || over) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(dx, { toValue: 70, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(hint, { toValue: 1, duration: 200, useNativeDriver: false }),
        ]),
        Animated.delay(780),
        Animated.parallel([
          Animated.spring(dx, { toValue: 0, friction: 7, tension: 60, useNativeDriver: false }),
          Animated.timing(hint, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
        Animated.delay(1600),
      ]),
    );
    nudge.current = loop;
    loop.start();
    return () => {
      loop.stop();
      nudge.current = null;
      hint.setValue(0);
    };
  }, [paused, menuOpen, over, dx, hint]);

  const finish = useCallback(
    (dir: 1 | -1) => {
      if (flying.current || over || paused || menuOpen) return;
      if (dir < 0 && skipsLeft === 0) {
        Animated.spring(dx, { toValue: 0, friction: 6, useNativeDriver: false }).start();
        return;
      }
      flying.current = true;
      swiped.current = true;
      Animated.parallel([
        Animated.timing(dx, { toValue: dir * 520, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: false }),
        Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: false }),
      ]).start(() => {
        if (dir > 0) {
          setScore((s) => s + 1);
          if (mode.bonusSeconds) {
            setLeft((s) => s + mode.bonusSeconds!);
            setTotal((tt) => Math.max(tt, left + mode.bonusSeconds!));
          }
        } else {
          setSkipsUsed((s) => s + 1);
        }
        if (idx + 1 >= deck.length) {
          setDeck(shuffled(pool));
          setIdx(0);
        } else {
          setIdx(idx + 1);
        }
        dx.setValue(0);
        fade.setValue(1);
        enter.setValue(0);
        Animated.spring(enter, { toValue: 1, friction: 9, tension: 70, useNativeDriver: false }).start(() => {
          flying.current = false;
        });
      });
    },
    [over, paused, menuOpen, skipsLeft, mode.bonusSeconds, left, idx, deck.length, pool, dx, fade, enter],
  );

  const finishRef = useRef(finish);
  finishRef.current = finish;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !flying.current,
      onMoveShouldSetPanResponder: (_, g) => !flying.current && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      // Keep the gesture if the browser starts selecting text under the pointer.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        // Touching the card shows the player knows it moves, so stop the nudge.
        swiped.current = true;
        nudge.current?.stop();
        dx.stopAnimation();
        hint.setValue(0);
      },
      onPanResponderMove: (_, g) => dx.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_AT) finishRef.current(1);
        else if (g.dx < -SWIPE_AT) finishRef.current(-1);
        else Animated.spring(dx, { toValue: 0, friction: 7, tension: 60, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dx, { toValue: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ w: Math.min(MAX_W, width), h: Math.min(MAX_H, height - 24) });
  };

  const skipText =
    skipsLeft === null ? `${skipsUsed} skip${skipsUsed === 1 ? '' : 's'}` : `${skipsLeft} skip${skipsLeft === 1 ? '' : 's'} left`;
  const subline = mode.scored ? `${score} pts · ${skipText}` : 'Just practice';
  const themeName = settings.category ?? 'All cards';
  const menuStatus = mode.timed
    ? `${formatClock(left)} left · ${score} pts · ${themeName}`
    : mode.scored
      ? `${score} pts · ${themeName}`
      : `Zen mode · ${themeName}`;

  const rotate = dx.interpolate({ inputRange: [-180, 0, 180], outputRange: ['-10deg', '0deg', '10deg'] });
  const enterY = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const enterOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const corFlex = dx.interpolate({ inputRange: [-120, 0, 120], outputRange: [0.3, 1, 3.2], extrapolate: 'clamp' });
  const skipFlex = dx.interpolate({ inputRange: [-120, 0, 120], outputRange: [3.2, 1, 0.3], extrapolate: 'clamp' });
  const corOpacity = dx.interpolate({ inputRange: [-120, 0], outputRange: [0.4, 1], extrapolate: 'clamp' });
  const skipOpacity = dx.interpolate({ inputRange: [0, 120], outputRange: [1, 0.4], extrapolate: 'clamp' });
  const skipBar = dx.interpolate({ inputRange: [-6, 0], outputRange: [t.barSkip, t.barIdle], extrapolate: 'clamp' });

  const statusLine = useMemo(
    () => (mode.scored ? `${score} pts · ${skipsLeft === null ? `${skipsUsed} skips` : `${skipsUsed} of ${settings.skips} skips`}` : 'Zen mode'),
    [mode.scored, score, skipsLeft, skipsUsed, settings.skips],
  );

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[styles.mode, font(800), { color: t.ink }]}>{mode.name}</Text>
            <View style={[styles.badge, { backgroundColor: t.accent }]}>
              <Text style={[styles.badgeText, font(800), { color: t.onAccent }]}>{difficulty.badge}</Text>
            </View>
          </View>
          <Text style={[styles.subline, font(500), { color: t.muted }]}>{subline}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          onPress={() => setMenuOpen(true)}
          style={[styles.menuButton, { backgroundColor: t.tile }]}
        >
          {[0, 1, 2].map((k) => (
            <View key={k} style={[styles.dot, { backgroundColor: t.ink }]} />
          ))}
        </Pressable>
      </View>

      <View style={styles.middle} onLayout={onArea}>
        <Animated.View style={[styles.hint, { opacity: hint }]} pointerEvents="none">
          <Svg width={20} height={20} viewBox="0 0 18 18">
            <Path d="M7 4 L12 9 L7 14" fill="none" stroke={t.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[styles.hintText, font(800), { color: t.accent }]}>SWIPE</Text>
        </Animated.View>

        {card ? (
          <Animated.View
            {...pan.panHandlers}
            style={{
              width: area.w,
              height: area.h,
              opacity: Animated.multiply(fade, enterOpacity),
              transform: [{ translateX: dx }, { translateY: enterY }, { rotate }, { scale: enterScale }],
            }}
          >
            {mode.timed ? (
              <>
                <TimerRing width={area.w} height={area.h} progress={left / total} track={t.track} color={t.accent} />
                <View style={[styles.clock, { backgroundColor: t.bg }]}>
                  <Text style={[styles.clockText, font(800), { color: t.ink }]}>{formatClock(left)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Pause"
                    onPress={() => setPaused(true)}
                    style={styles.pause}
                  >
                    <Svg width={14} height={14} viewBox="0 0 14 14">
                      <Path d="M4.5 2.5 V11.5 M9.5 2.5 V11.5" stroke={t.ink} strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                  </Pressable>
                </View>
              </>
            ) : null}
            <View
              style={[
                styles.tile,
                { backgroundColor: t.tile },
                mode.timed ? { top: 18, left: 18, right: 18, bottom: 18 } : StyleSheet.absoluteFill,
              ]}
            >
              <Text style={[styles.yourWord, font(500), { color: t.ink }]}>Your word</Text>
              <Text style={[styles.word, font(800), { color: t.ink }]} adjustsFontSizeToFit numberOfLines={2}>
                {card.word}
              </Text>
              <View style={styles.bannedBlock}>
                <Text style={[styles.dontSay, font(700), { color: t.ink }]}>DON'T SAY</Text>
                <View style={styles.chips}>
                  {card.banned.map((b) => (
                    <View key={b} style={styles.chip}>
                      <Text style={[styles.chipText, font(500), { color: t.ink }]}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.bars}>
        <Animated.View style={[styles.barCol, { flex: skipFlex }]}>
          <Animated.Text style={[styles.barLabel, font(700), { color: t.muted, opacity: skipOpacity }]} numberOfLines={1}>
            ← Skip
          </Animated.Text>
          <Animated.View style={[styles.bar, { backgroundColor: skipBar }]} />
        </Animated.View>
        <Animated.View style={[styles.barCol, styles.barColRight, { flex: corFlex }]}>
          <Animated.Text style={[styles.barLabel, font(700), { color: t.correctText, opacity: corOpacity }]} numberOfLines={1}>
            Correct →
          </Animated.Text>
          <View style={[styles.bar, styles.barStretch, { backgroundColor: t.accent }]} />
        </Animated.View>
      </View>

      {over ? (
        <View style={[styles.overlay, { backgroundColor: t.bg }]}>
          <Text style={[styles.overLabel, font(700), { color: t.muted }]}>TIME'S UP</Text>
          <Text style={[styles.bigScore, font(800), { color: t.ink }]}>{score}</Text>
          <Text style={[styles.overSub, font(500), { color: t.muted }]}>
            points · {skipsUsed} skip{skipsUsed === 1 ? '' : 's'}
          </Text>
          <View style={styles.overlayButtons}>
            <Button t={t} primary label="Play again" onPress={onRestart} />
            <Button t={t} label="Change settings" onPress={onChangeSettings} />
          </View>
        </View>
      ) : null}

      {paused && !over ? (
        <View style={[styles.overlay, { backgroundColor: t.bg + 'F0' }]}>
          <Text style={[styles.overLabel, font(700), { color: t.muted }]}>PAUSED</Text>
          <Text style={[styles.pausedClock, font(800), { color: t.ink }]}>{formatClock(left)}</Text>
          <Text style={[styles.overSub, font(500), { color: t.muted }]}>{statusLine}</Text>
          <View style={styles.overlayButtons}>
            <Button t={t} primary label="Resume" onPress={() => setPaused(false)} />
            <Button t={t} label="Change settings" onPress={onChangeSettings} />
            <Button t={t} label="New game" onPress={onRestart} />
          </View>
        </View>
      ) : null}

      <GameMenu
        visible={menuOpen}
        theme={t}
        status={menuStatus}
        modeId={settings.mode}
        onResume={() => setMenuOpen(false)}
        onRestart={() => {
          setMenuOpen(false);
          onRestart();
        }}
        onChangeMode={(m) => {
          setMenuOpen(false);
          onChangeMode(m);
        }}
        onChangeTheme={onChangeTheme}
      />
    </View>
  );
}

function Button({ t, label, primary, onPress }: { t: Theme; label: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: t.accent, height: 58 }
          : { borderWidth: 1.5, borderColor: t.outline, backgroundColor: 'transparent' },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, font(700), { color: primary ? t.onAccent : t.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 2 },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mode: { fontSize: 26, letterSpacing: -0.5 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, letterSpacing: 0.6 },
  subline: { fontSize: 13, marginTop: 1 },
  menuButton: { width: 36, height: 36, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', left: 4, width: 56, alignItems: 'center', gap: 4 },
  hintText: { fontSize: 12, letterSpacing: 0.7 },
  clock: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    height: 32,
    paddingLeft: 10,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
  },
  clockText: { fontSize: 15, fontVariant: ['tabular-nums'] },
  pause: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tile: { position: 'absolute', borderRadius: 20, paddingVertical: 30, paddingHorizontal: 22, overflow: 'hidden' },
  yourWord: { fontSize: 13, opacity: 0.75 },
  word: { fontSize: 50, lineHeight: 54, letterSpacing: -1, marginTop: 2 },
  bannedBlock: { marginTop: 'auto' },
  dontSay: { fontSize: 11, letterSpacing: 0.9 },
  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15 },
  chipText: { fontSize: 18 },
  bars: { flexDirection: 'row', gap: 12, paddingHorizontal: 2 },
  barCol: { minWidth: 0, gap: 8 },
  barColRight: { alignItems: 'flex-end' },
  barLabel: { fontSize: 16 },
  bar: { height: 6, borderRadius: 3 },
  barStretch: { alignSelf: 'stretch' },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
  },
  overLabel: { fontSize: 13, letterSpacing: 1 },
  bigScore: { fontSize: 72, lineHeight: 76 },
  pausedClock: { fontSize: 56, lineHeight: 60, fontVariant: ['tabular-nums'] },
  overSub: { fontSize: 15, textAlign: 'center' },
  overlayButtons: { marginTop: 24, width: 240, gap: 10 },
  button: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16 },
});
