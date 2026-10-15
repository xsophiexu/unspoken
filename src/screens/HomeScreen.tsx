import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DECKS, TIMER_OPTIONS } from '../game';
import { useTheme } from '../theme';
import type { Difficulty, RoundSettings } from '../types';

type Props = {
  onStart: (settings: RoundSettings) => void;
};

export function HomeScreen({ onStart }: Props) {
  const t = useTheme();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [timer, setTimer] = useState<number | null>(60);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.ink }]}>Unspoken</Text>
        <Text style={[styles.tagline, { color: t.muted }]}>
          Get them to say the word. Don't say the six that would make it easy.
        </Text>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: t.muted }]}>Difficulty</Text>
        <View style={styles.row}>
          {(Object.keys(DECKS) as Difficulty[]).map((key) => (
            <Choice
              key={key}
              label={DECKS[key].label}
              detail={`${DECKS[key].cards.length} cards`}
              selected={difficulty === key}
              onPress={() => setDifficulty(key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: t.muted }]}>Timer</Text>
        <View style={styles.row}>
          {TIMER_OPTIONS.map((seconds) => (
            <Choice
              key={String(seconds)}
              label={seconds === null ? 'Off' : `${seconds}s`}
              selected={timer === seconds}
              onPress={() => setTimer(seconds)}
            />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onStart({ difficulty, timer })}
        style={({ pressed }) => [
          styles.start,
          { backgroundColor: t.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.startText, { color: t.onSolid }]}>Start round</Text>
      </Pressable>
    </View>
  );
}

function Choice({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: t.card,
          borderColor: selected ? t.accent : t.line,
        },
      ]}
    >
      <Text style={[styles.choiceText, { color: selected ? t.accent : t.ink }]}>{label}</Text>
      {detail ? <Text style={[styles.choiceDetail, { color: t.muted }]}>{detail}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, gap: 28, justifyContent: 'center' },
  header: { gap: 8 },
  title: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  tagline: { fontSize: 16, lineHeight: 22 },
  group: { gap: 10 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: {
    flexGrow: 1,
    minHeight: 52,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  choiceText: { fontSize: 16, fontWeight: '600' },
  choiceDetail: { fontSize: 13, marginTop: 2 },
  start: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 17, fontWeight: '700' },
});
