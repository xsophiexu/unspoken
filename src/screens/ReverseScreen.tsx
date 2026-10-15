import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '../components/Button';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { GameHeader } from '../components/GameHeader';
import { GameMenu } from '../components/GameMenu';
import { bannedCountFor, cardsFor, difficultyOf, shuffled, themeLabel } from '../game';
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

type Phase = 'howTo' | 'guess' | 'answer';

const FIRST_CLUES = 3;
const SWIPE_AT = 100;

// The how-to card shows once per app session.
let seenHowTo = false;

// Reverse mode from the design canvas: read the banned words as clues and guess the hidden word.
export function ReverseScreen({ settings, theme: t, onRestart, onChangeSettings, onChangeDifficulty, onChangeTheme }: Props) {
  const difficulty = difficultyOf(settings.difficulty);
  const pool = useMemo(() => cardsFor(settings.difficulty, settings.categories), [settings.difficulty, settings.categories]);

  const [deck, setDeck] = useState<Card[]>(() => shuffled(pool));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>(seenHowTo ? 'guess' : 'howTo');
  const [revealed, setRevealed] = useState(FIRST_CLUES);
  // The eye button shows the hidden word in place of the blanks, for a quick check.
  const [peek, setPeek] = useState(false);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingLevel, setPickingLevel] = useState(false);
  const [cardWidth, setCardWidth] = useState(342);

  const shownCard = deck[idx];
  // Reverse uses the same number of clues as the banned words a level shows.
  const card = shownCard && { ...shownCard, banned: shownCard.banned.slice(0, bannedCountFor(settings.difficulty)) };
  const clueCount = card?.banned.length ?? 0;
  // All clues showing is still worth a point.
  const worth = clueCount + 1 - revealed;
  const themeName = themeLabel(settings.categories);

  const dx = useState(() => new Animated.Value(0))[0];
  const flying = useRef(false);

  const next = (got: boolean) => {
    if (got) setScore((s) => s + worth);
    setPlayed((n) => n + 1);
    if (idx + 1 >= deck.length) {
      setDeck(shuffled(pool));
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
    setRevealed(FIRST_CLUES);
    setPeek(false);
    setPhase('guess');
  };

  const finish = (dir: 1 | -1) => {
    if (flying.current) return;
    flying.current = true;
    Animated.timing(dx, { toValue: dir * 520, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: false }).start(
      () => {
        next(dir > 0);
        dx.setValue(0);
        flying.current = false;
      },
    );
  };

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
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => dx.stopAnimation(),
      onPanResponderMove: (_, g) => dx.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_AT) finishRef.current(1);
        else if (g.dx < -SWIPE_AT) finishRef.current(-1);
        else Animated.spring(dx, { toValue: 0, friction: 7, tension: 60, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => Animated.spring(dx, { toValue: 0, useNativeDriver: false }).start(),
    }),
  );

  const rotate = dx.interpolate({ inputRange: [-180, 0, 180], outputRange: ['-10deg', '0deg', '10deg'] });
  const gotFlex = dx.interpolate({ inputRange: [-120, 0, 120], outputRange: [0.3, 1, 3.2], extrapolate: 'clamp' });
  const missFlex = dx.interpolate({ inputRange: [-120, 0, 120], outputRange: [3.2, 1, 0.3], extrapolate: 'clamp' });
  const missBar = dx.interpolate({ inputRange: [-6, 0], outputRange: [t.barSkip, t.barIdle], extrapolate: 'clamp' });

  const subline = `${score} pts · ${played} word${played === 1 ? '' : 's'}`;

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <GameHeader
        theme={t}
        title="Reverse"
        badge={difficulty.badge}
        subline={subline}
        onBadge={() => setPickingLevel(true)}
        onMenu={() => setMenuOpen(true)}
      />

      <View style={styles.middle}>
        {phase === 'howTo' ? (
          <View style={[styles.card, { backgroundColor: t.tile }]}>
            <Text style={[styles.kicker, font(500), { color: t.ink }]}>How it works</Text>
            <Text style={[styles.howTitle, font(800), { color: t.ink }]}>{'Clues first,\nword last'}</Text>
            {[
              ['The guesser holds the phone', 'Everyone else stays quiet.'],
              ['Read the clues out loud', 'These are the words you would normally be banned from saying.'],
              ['Guess the hidden word', 'Stuck? Reveal another clue, but the word is worth one point less.'],
              ['Reveal and swipe', 'Right if you got it, left if you missed.'],
            ].map(([title, body], i) => (
              <View key={title} style={[styles.step, i > 0 && { borderTopWidth: 1, borderTopColor: t.outline }]}>
                <View style={[styles.stepNum, { backgroundColor: t.accent }]}>
                  <Text style={[styles.stepNumText, font(800), { color: t.onAccent }]}>{i + 1}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, font(700), { color: t.ink }]}>{title}</Text>
                  <Text style={[styles.stepBody, font(500), { color: t.muted }]}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {phase === 'guess' && card ? (
          <View style={[styles.card, { backgroundColor: t.tile }]}>
            <View style={styles.guessTop}>
              <Text style={[styles.kickerInline, font(500), { color: t.ink }]}>Hidden word</Text>
              <View style={styles.worth}>
                <Text style={[styles.worthText, font(800), { color: t.correctText }]}>
                  Worth {worth} pt{worth === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
            <View style={styles.wordRow}>
              <View style={styles.wordSlot}>
                {peek ? (
                  <Text style={[styles.peekWord, font(800), { color: t.ink }]} numberOfLines={2}>
                    {card.word}
                  </Text>
                ) : (
                  <Blanks word={card.word} color={t.accent} />
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={peek ? 'Hide the word' : 'Show the word'}
                onPress={() => setPeek((v) => !v)}
                hitSlop={6}
                style={({ pressed }) => [styles.eye, { opacity: pressed ? 0.7 : 1 }]}
              >
                <EyeIcon open={!peek} color={t.ink} />
              </Pressable>
            </View>
            <Text style={[styles.letters, font(500), { color: t.muted }]}>{letterCount(card.word)}</Text>
            <View style={styles.bottom}>
              <Text style={[styles.section, font(700), { color: t.ink }]}>CLUES</Text>
              <View style={styles.chips}>
                {card.banned.map((b, i) =>
                  i < revealed ? (
                    <View key={b} style={styles.chip}>
                      <Text style={[styles.chipText, font(500), { color: t.ink }]}>{b}</Text>
                    </View>
                  ) : (
                    <View key={b} style={[styles.chipHidden, { borderColor: t.outline }]}>
                      <Text style={[styles.chipText, font(500), { color: t.outline }]}>?</Text>
                    </View>
                  ),
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={revealed >= clueCount}
                onPress={() => setRevealed((r) => Math.min(clueCount, r + 1))}
                style={({ pressed }) => [
                  styles.reveal,
                  { borderColor: t.outline, opacity: revealed >= clueCount ? 0.45 : pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.revealText, font(700), { color: t.ink }]}>
                  {revealed >= clueCount ? 'Every clue is showing' : 'Reveal next clue · −1 pt'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {phase === 'answer' && card ? (
          <Animated.View
            {...pan.panHandlers}
            onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
            style={[styles.card, { backgroundColor: t.tile, transform: [{ translateX: dx }, { rotate }] }]}
          >
            <Text style={[styles.kicker, font(500), { color: t.ink }]}>The word was</Text>
            <Text style={[styles.word, font(800), { color: t.ink }, wordSize(card.word, cardWidth - 48)]} numberOfLines={3}>
              {card.word}
            </Text>
            <Text style={[styles.question, font(500), { color: t.muted }]}>Did you say it before the reveal?</Text>
            <View style={styles.bottom}>
              <Text style={[styles.section, font(700), { color: t.ink }]}>
                CLUES USED · {revealed} OF {clueCount}
              </Text>
              <View style={styles.chips}>
                {card.banned.map((b, i) => (
                  <View key={b} style={[styles.chip, i >= revealed && { backgroundColor: t.barIdle }]}>
                    <Text style={[styles.chipText, font(500), { color: i < revealed ? t.ink : t.muted }]}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {phase === 'howTo' ? (
        <Button
          t={t}
          primary
          label="Start"
          onPress={() => {
            seenHowTo = true;
            setPhase('guess');
          }}
        />
      ) : null}
      {phase === 'guess' ? <Button t={t} primary label="Show the word" onPress={() => setPhase('answer')} /> : null}
      {phase === 'answer' ? (
        <View style={styles.bars}>
          <Animated.View style={[styles.barCol, { flex: missFlex }]}>
            <Pressable accessibilityRole="button" onPress={() => finish(-1)} hitSlop={10}>
              <Text style={[styles.barLabel, font(700), { color: t.muted }]} numberOfLines={1}>
                ← Missed
              </Text>
            </Pressable>
            <Animated.View style={[styles.bar, { backgroundColor: missBar }]} />
          </Animated.View>
          <Animated.View style={[styles.barCol, styles.barColRight, { flex: gotFlex }]}>
            <Pressable accessibilityRole="button" onPress={() => finish(1)} hitSlop={10}>
              <Text style={[styles.barLabel, font(700), { color: t.correctText }]} numberOfLines={1}>
                Got it →
              </Text>
            </Pressable>
            <View style={[styles.bar, styles.barStretch, { backgroundColor: t.accent }]} />
          </Animated.View>
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
        status={`${subline} · ${themeName}`}
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

function letterCount(word: string): string {
  const words = word.trim().split(/\s+/);
  const letters = word.replace(/[^\p{L}\p{N}]/gu, '').length;
  return words.length > 1 ? `${words.length} words · ${letters} letters` : `${letters} letters`;
}

// One underline per letter, grouped by word. Long answers get narrower blanks.
function Blanks({ word, color }: { word: string; color: string }) {
  const words = word.trim().split(/\s+/);
  const longest = Math.max(...words.map((w) => w.length));
  // Leave room for the eye button: about 230px on a typical phone.
  const size = Math.max(12, Math.min(30, Math.floor((230 - 6 * (longest - 1)) / longest)));
  return (
    <View style={styles.blankWords}>
      {words.map((w, wi) => (
        <View key={wi} style={styles.blankRow}>
          {[...w].map((ch, i) =>
            /[\p{L}\p{N}]/u.test(ch) ? (
              <View key={i} style={[styles.blank, { width: size, height: size + 8, borderBottomColor: color }]} />
            ) : (
              <Text key={i} style={[styles.blankPunct, font(800), { color }]}>
                {ch}
              </Text>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: 16 },
  card: { flex: 1, maxHeight: 560, borderRadius: 26, paddingVertical: 30, paddingHorizontal: 24 },
  kicker: { fontSize: 13, opacity: 0.75 },
  kickerInline: { fontSize: 13, opacity: 0.75 },
  howTitle: { fontSize: 36, lineHeight: 40, letterSpacing: -0.8, marginTop: 2, marginBottom: 12 },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 12 },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 14 },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 16 },
  stepBody: { fontSize: 14, marginTop: 2 },
  wordRow: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  wordSlot: { flex: 1, minHeight: 44, justifyContent: 'flex-end' },
  peekWord: { fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  eye: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  guessTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  worth: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  worthText: { fontSize: 12 },
  blankWords: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6 },
  blankRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  blank: { borderBottomWidth: 4 },
  blankPunct: { fontSize: 24 },
  letters: { marginTop: 8, fontSize: 13 },
  word: { fontSize: 50, lineHeight: 54, letterSpacing: -1, marginTop: 2 },
  question: { marginTop: 10, fontSize: 15 },
  bottom: { marginTop: 'auto' },
  section: { fontSize: 11, letterSpacing: 0.9 },
  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15 },
  chipHidden: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 9,
    width: 62,
    alignItems: 'center',
  },
  chipText: { fontSize: 18 },
  reveal: { marginTop: 16, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  revealText: { fontSize: 15 },
  bars: { flexDirection: 'row', gap: 12, paddingHorizontal: 2 },
  barCol: { minWidth: 0, gap: 8 },
  barColRight: { alignItems: 'flex-end' },
  barLabel: { fontSize: 16 },
  bar: { height: 6, borderRadius: 3 },
  barStretch: { alignSelf: 'stretch' },
});

function wordSize(word: string, width: number) {
  const size = fitWordSize(word, width);
  return { fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: -size * 0.02 };
}

// Open eye: the word is hidden, tap to show. Struck-through eye: the word is showing, tap to hide.
function EyeIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12 C4.5 7 8 4.5 12 4.5 C16 4.5 19.5 7 22 12 C19.5 17 16 19.5 12 19.5 C8 19.5 4.5 17 2 12 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={2} />
      {open ? null : <Path d="M4 20 L20 4" stroke={color} strokeWidth={2.2} strokeLinecap="round" />}
    </Svg>
  );
}
