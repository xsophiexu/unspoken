import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DECKS, formatClock, shuffled } from '../game';
import { useTheme } from '../theme';
import type { Card, RoundResult, RoundSettings } from '../types';

type Props = {
  settings: RoundSettings;
  onFinish: (result: RoundResult) => void;
  onQuit: () => void;
};

export function PlayScreen({ settings, onFinish, onQuit }: Props) {
  const t = useTheme();
  const deck = useMemo(() => shuffled(DECKS[settings.difficulty].cards), [settings]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timer);
  const result = useRef<RoundResult>({ correct: [], skipped: [] });

  const card: Card | undefined = deck[index];

  // Count down once per second while a timer is set.
  useEffect(() => {
    if (settings.timer === null) return;
    const id = setInterval(() => {
      setTimeLeft((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [settings.timer]);

  useEffect(() => {
    if (timeLeft === 0 || index >= deck.length) onFinish(result.current);
  }, [timeLeft, index, deck.length, onFinish]);

  function answer(gotIt: boolean) {
    if (!card) return;
    (gotIt ? result.current.correct : result.current.skipped).push(card);
    setIndex((i) => i + 1);
  }

  if (!card) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" onPress={onQuit} hitSlop={12}>
          <Text style={[styles.quit, { color: t.muted }]}>End round</Text>
        </Pressable>
        <Text style={[styles.meta, { color: t.muted }]}>
          {timeLeft !== null ? formatClock(timeLeft) : `${deck.length - index} left`}
        </Text>
        <Text style={[styles.meta, { color: t.ok }]}>{result.current.correct.length} correct</Text>
      </View>

      <View style={[styles.card, { backgroundColor: t.card }]}>
        <Text style={[styles.level, { color: t.accent, borderColor: t.accent }]}>
          {DECKS[settings.difficulty].label}
        </Text>
        <View style={styles.wordBlock}>
          <Text style={[styles.label, { color: t.muted }]}>Get them to say</Text>
          <Text style={[styles.word, { color: t.ink }]} adjustsFontSizeToFit numberOfLines={2}>
            {card.word}
          </Text>
        </View>
        <View style={[styles.banned, { borderTopColor: t.line }]}>
          <Text style={[styles.label, { color: t.ban }]}>Don't say</Text>
          <View style={styles.grid}>
            {card.banned.map((b) => (
              <View key={b} style={[styles.chip, { backgroundColor: t.banSoft }]}>
                <Text style={[styles.chipX, { color: t.ban }]}>×</Text>
                <Text style={[styles.chipText, { color: t.ink }]} numberOfLines={2}>
                  {b}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => answer(false)}
          style={({ pressed }) => [
            styles.button,
            { flex: 1, backgroundColor: t.card, borderColor: t.line, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: t.ink }]}>Skip</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => answer(true)}
          style={({ pressed }) => [
            styles.button,
            { flex: 1.6, backgroundColor: t.ok, borderColor: t.ok, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: t.onSolid }]}>Correct</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 20, justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quit: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 22,
    shadowColor: '#14163c',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  level: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  wordBlock: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  word: { fontSize: 46, fontWeight: '800', letterSpacing: -1 },
  banned: { borderTopWidth: 1, paddingTop: 18, gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  chipX: { fontSize: 18, fontWeight: '700' },
  chipText: { fontSize: 16, fontWeight: '500', flexShrink: 1 },
  controls: { flexDirection: 'row', gap: 12 },
  button: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
});
