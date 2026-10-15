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

import { Button } from '../components/Button';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { GameHeader } from '../components/GameHeader';
import { GameMenu } from '../components/GameMenu';
import { TimerRing } from '../components/TimerRing';
import {
  ESCALATE,
  bannedCountFor,
  cardsFor,
  difficultyOf,
  formatClock,
  hiddenSecondsFor,
  modeOf,
  shuffled,
  themeLabel,
} from '../game';
import { fitWordSize } from '../fitWord';
import { font, type Theme } from '../theme';
import type { Card, Difficulty, GameSettings } from '../types';

type Props = {
  settings: GameSettings;
  theme: Theme;
  onRestart: () => void;
  onChangeSettings: () => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onChangeTheme: (index: number) => void;
};

const MAX_W = 350;
const MAX_H = 580;
const SWIPE_AT = 100;
const HINT_IDLE_MS = 30_000;

// The Current Version screen from the design canvas: a swipeable card inside a timer ring.
// Hot potato reuses it with the clock hidden and a pass screen after every word.
export function PlayScreen({ settings, theme: t, onRestart, onChangeSettings, onChangeDifficulty, onChangeTheme }: Props) {
  const mode = modeOf(settings.mode);
  const hot = mode.id === 'hotPotato';
  const esc = mode.id === 'escalate';
  const difficulty = difficultyOf(settings.difficulty);
  const pool = useMemo(() => {
    const cards = cardsFor(settings.difficulty, settings.categories);
    // Escalate needs cards with all 10 banned words; fall back to every card while the bank has fewer.
    const full = cards.filter((c) => c.banned.length >= ESCALATE.max);
    return esc && full.length >= 20 ? full : cards;
  }, [settings.difficulty, settings.categories, esc]);

  const [deck, setDeck] = useState<Card[]>(() => shuffled(pool));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [startSeconds] = useState(() => (hot ? hiddenSecondsFor(settings.difficulty) : settings.roundSeconds));
  const [total, setTotal] = useState(startSeconds);
  const [left, setLeft] = useState(startSeconds);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingLevel, setPickingLevel] = useState(false);
  const [passing, setPassing] = useState(false);
  const [area, setArea] = useState({ w: MAX_W, h: MAX_H });

  // Escalate: correct answers raise the banned-word count; three correct at the top level wins.
  const level = Math.min(ESCALATE.max, ESCALATE.start + score);
  const atMax = Math.max(0, score - (ESCALATE.max - ESCALATE.start));
  const won = esc && atMax >= ESCALATE.winAtMax;
  const shown = esc ? level : bannedCountFor(settings.difficulty);
  const over = (mode.timed && left <= 0) || won;
  const halted = paused || menuOpen || pickingLevel || passing;
  const running = mode.timed && !halted && !over;
  const skipsLeft = !mode.skips || settings.skips === null ? null : Math.max(0, settings.skips - skipsUsed);
  const card = deck[idx];

  const dx = useState(() => new Animated.Value(0))[0];
  const enter = useState(() => new Animated.Value(1))[0];
  const fade = useState(() => new Animated.Value(1))[0];
  const hint = useState(() => new Animated.Value(0))[0];
  const flying = useRef(false);
  // Set once the opening hint has played; after that the hint waits for 30 idle seconds.
  const shownHint = useRef(false);
  // Bumped by every swipe or tap, which restarts the 30-second hint wait.
  const [idleTick, setIdleTick] = useState(0);
  const nudge = useRef<Animated.CompositeAnimation | null>(null);

  // Clock.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Nudge the card right to show it swipes: once when the game opens, then after 30 seconds without a swipe or tap.
  useEffect(() => {
    if (halted || over) return;
    const id = setTimeout(
      () => {
        shownHint.current = true;
        const seq = Animated.sequence([
          Animated.parallel([
            Animated.timing(dx, { toValue: 70, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: false }),
            Animated.timing(hint, { toValue: 1, duration: 200, useNativeDriver: false }),
          ]),
          Animated.delay(780),
          Animated.parallel([
            Animated.spring(dx, { toValue: 0, friction: 7, tension: 60, useNativeDriver: false }),
            Animated.timing(hint, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]),
        ]);
        nudge.current = seq;
        seq.start(({ finished }) => {
          if (nudge.current !== seq) return;
          nudge.current = null;
          if (finished) setIdleTick((n) => n + 1);
        });
      },
      shownHint.current ? HINT_IDLE_MS : 600,
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
  }, [halted, over, idleTick, dx, hint]);

  const finish = useCallback(
    (dir: 1 | -1) => {
      if (flying.current || over || halted) return;
      if (dir < 0 && skipsLeft === 0) {
        Animated.spring(dx, { toValue: 0, friction: 6, useNativeDriver: false }).start();
        return;
      }
      flying.current = true;
      shownHint.current = true;
      setIdleTick((n) => n + 1);
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
        if (hot) setPassing(true);
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
    [over, halted, skipsLeft, mode.bonusSeconds, left, idx, deck.length, pool, hot, dx, fade, enter],
  );

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  // The handlers only read refs when a gesture fires, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !flying.current,
      onMoveShouldSetPanResponder: (_, g) => !flying.current && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      // Keep the gesture if the browser starts selecting text under the pointer.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        // Touching the card stops the hint and restarts its 30-second wait.
        shownHint.current = true;
        nudge.current?.stop();
        nudge.current = null;
        setIdleTick((n) => n + 1);
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
  );

  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ w: Math.min(MAX_W, width), h: Math.min(MAX_H, height - 24) });
  };

  const skipText =
    skipsLeft === null ? `${skipsUsed} skip${skipsUsed === 1 ? '' : 's'}` : `${skipsLeft} skip${skipsLeft === 1 ? '' : 's'} left`;
  // Modes without a skip limit just count, like the Endless wireframe.
  const tally = `${score} correct · ${skipsUsed} skipped`;
  const escLine =
    level < ESCALATE.max ? `${level} banned words · ${skipText}` : `10 banned · ${atMax} of ${ESCALATE.winAtMax} to win · ${skipText}`;
  const subline = esc ? escLine : hot ? 'Pass after every word' : !mode.scored ? 'Just practice' : mode.skips ? `${score} pts · ${skipText}` : tally;
  const themeName = themeLabel(settings.categories);
  const menuStatus = hot
    ? `Hot potato · timer hidden · ${themeName}`
    : mode.timed
    ? `${formatClock(left)} left · ${score} pts · ${themeName}`
    : mode.scored
      ? `${mode.skips ? `${score} pts` : tally} · ${themeName}`
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
    () => (hot ? `${score} words passed` : mode.scored && !mode.skips ? tally : mode.scored ? `${score} pts · ${skipsLeft === null ? `${skipsUsed} skips` : `${skipsUsed} of ${settings.skips} skips`}` : 'Zen mode'),
    [hot, mode.scored, mode.skips, tally, score, skipsLeft, skipsUsed, settings.skips],
  );

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <GameHeader
        theme={t}
        title={mode.name}
        badge={difficulty.badge}
        subline={subline}
        onBadge={() => setPickingLevel(true)}
        onMenu={() => setMenuOpen(true)}
      />

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
                <TimerRing width={area.w} height={area.h} progress={hot ? 0 : left / total} track={t.track} color={t.accent} />
                <View style={[styles.clock, { backgroundColor: t.bg }]}>
                  <Text style={[styles.clockText, font(800), { color: t.ink }]}>{hot ? 'Hidden' : formatClock(left)}</Text>
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
              <Text style={[styles.word, font(800), { color: t.ink }, wordSize(card.word, area.w - 36 - 44)]} numberOfLines={3}>
                {card.word}
              </Text>
              <View style={styles.bannedBlock}>
                <Text style={[styles.dontSay, font(700), { color: t.ink }]}>DON&apos;T SAY</Text>
                <View style={styles.chips}>
                  {card.banned.slice(0, shown).map((b, i, list) => {
                    // The word added by the last correct answer, until the top level is reached.
                    const fresh = esc && score > 0 && score <= ESCALATE.max - ESCALATE.start && i === level - 1;
                    const small = list.length > 6;
                    return (
                      <View
                        key={b}
                        style={[
                          styles.chip,
                          small && styles.chipSmall,
                          fresh && [styles.chipNew, small ? styles.chipNewSmall : null, { borderColor: t.accent }],
                        ]}
                      >
                        <Text style={[styles.chipText, small && styles.chipTextSmall, font(500), { color: t.ink }]}>{b}</Text>
                        {fresh ? <Text style={[styles.newTag, font(700), { color: t.accent }]}>NEW</Text> : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.bars}>
        <Animated.View style={[styles.barCol, { flex: skipFlex }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            onPress={() => finish(-1)}
            hitSlop={{ top: 16, bottom: 12 }}
            style={styles.barPress}
          >
            <Animated.Text style={[styles.barLabel, font(700), { color: t.muted, opacity: skipOpacity }]} numberOfLines={1}>
              ← Skip
            </Animated.Text>
            <Animated.View style={[styles.bar, { backgroundColor: skipBar }]} />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.barCol, { flex: corFlex }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Correct"
            onPress={() => finish(1)}
            hitSlop={{ top: 16, bottom: 12 }}
            style={[styles.barPress, styles.barColRight]}
          >
            <Animated.Text style={[styles.barLabel, font(700), { color: t.correctText, opacity: corOpacity }]} numberOfLines={1}>
              Correct →
            </Animated.Text>
            <View style={[styles.bar, styles.barStretch, { backgroundColor: t.accent }]} />
          </Pressable>
        </Animated.View>
      </View>
      {hot ? (
        <Text style={[styles.hotNote, font(500), { color: t.muted }]}>Holding it when time runs out loses a point</Text>
      ) : null}

      {over ? (
        <View style={[styles.overlay, { backgroundColor: t.bg }]}>
          <Text style={[styles.overLabel, font(700), { color: t.muted }]}>{won ? 'YOU WIN' : "TIME'S UP"}</Text>
          {esc ? (
            <>
              <Text style={[styles.bigScore, font(800), { color: t.ink }]}>{won ? formatClock(left) : level}</Text>
              <Text style={[styles.overSub, font(500), { color: t.muted }]}>
                {won
                  ? `left on the clock · ${skipsUsed} skip${skipsUsed === 1 ? '' : 's'}`
                  : `banned words reached · ${score} correct`}
              </Text>
            </>
          ) : hot ? (
            <>
              <Text style={[styles.hotTitle, font(800), { color: t.ink }]}>Whoever is holding the phone loses a point</Text>
              <Text style={[styles.overSub, font(500), { color: t.muted }]}>
                {score} word{score === 1 ? '' : 's'} guessed this round
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.bigScore, font(800), { color: t.ink }]}>{score}</Text>
              <Text style={[styles.overSub, font(500), { color: t.muted }]}>
                points · {skipsUsed} skip{skipsUsed === 1 ? '' : 's'}
              </Text>
            </>
          )}
          <View style={styles.overlayButtons}>
            <Button t={t} primary label="Play again" onPress={onRestart} />
            <Button t={t} label="Change settings" onPress={onChangeSettings} />
          </View>
        </View>
      ) : null}

      {paused && !over ? (
        <View style={[styles.overlay, { backgroundColor: t.bg + 'F0' }]}>
          <Text style={[styles.overLabel, font(700), { color: t.muted }]}>PAUSED</Text>
          <Text style={[styles.pausedClock, font(800), { color: t.ink }]}>{hot ? 'Hidden' : formatClock(left)}</Text>
          <Text style={[styles.overSub, font(500), { color: t.muted }]}>{statusLine}</Text>
          <View style={styles.overlayButtons}>
            <Button t={t} primary label="Resume" onPress={() => setPaused(false)} />
            <Button t={t} label="Change settings" onPress={onChangeSettings} />
            <Button t={t} label="New game" onPress={onRestart} />
          </View>
        </View>
      ) : null}

      {passing && !over ? (
        <View style={[styles.passScreen, { backgroundColor: t.bg }]}>
          <View style={styles.passTop}>
            <Text style={[styles.passTopText, font(500), { color: t.muted }]}>
              <Text style={[font(700), { color: t.ink }]}>Hot potato</Text> · {difficulty.id}
            </Text>
            <Text style={[styles.passTopText, font(500), { color: t.muted }]}>Timer paused</Text>
          </View>
          <View style={styles.passMiddle}>
            <Text style={[styles.overLabel, font(700), { color: t.muted }]}>PASS THE PHONE</Text>
            <Text style={[styles.passTitle, font(800), { color: t.ink }]}>{'Next player,\nready?'}</Text>
          </View>
          <Button t={t} primary label="I'm ready" onPress={() => setPassing(false)} />
        </View>
      ) : null}

      <DifficultyPicker
        visible={pickingLevel}
        theme={t}
        current={settings.difficulty}
        categories={settings.categories}
        onClose={() => setPickingLevel(false)}
        onPick={(d) => {
          setPickingLevel(false);
          onChangeDifficulty(d);
        }}
      />

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
        onChangeSettings={() => {
          setMenuOpen(false);
          onChangeSettings();
        }}
        onChangeTheme={onChangeTheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
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
  chipSmall: { paddingVertical: 8, paddingHorizontal: 11 },
  chipTextSmall: { fontSize: 15 },
  chipNew: { borderWidth: 2, paddingVertical: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipNewSmall: { paddingVertical: 6, paddingHorizontal: 9 },
  newTag: { fontSize: 11, letterSpacing: 0.6 },
  bars: { flexDirection: 'row', gap: 12, paddingHorizontal: 2 },
  barCol: { minWidth: 0 },
  barPress: { gap: 8, paddingTop: 8 },
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
  hotNote: { fontSize: 12, marginTop: 6, paddingHorizontal: 2 },
  hotTitle: { fontSize: 30, lineHeight: 34, textAlign: 'center', letterSpacing: -0.5 },
  passScreen: { ...StyleSheet.absoluteFill, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  passTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  passTopText: { fontSize: 13 },
  passMiddle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  passTitle: { fontSize: 40, lineHeight: 44, textAlign: 'center', letterSpacing: -0.8 },
});

function wordSize(word: string, width: number) {
  const size = fitWordSize(word, width);
  return { fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: -size * 0.02 };
}
