import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import type { RoundResult } from '../types';

type Props = {
  result: RoundResult;
  onPlayAgain: () => void;
  onHome: () => void;
};

export function ResultsScreen({ result, onPlayAgain, onHome }: Props) {
  const t = useTheme();
  const { correct, skipped } = result;

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <Text style={[styles.label, { color: t.muted }]}>Round over</Text>
        <Text style={[styles.big, { color: t.ok }]}>{correct.length}</Text>
        <Text style={[styles.sub, { color: t.muted }]}>
          correct, {skipped.length} skipped
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listInner}>
        {correct.map((c) => (
          <Text key={`c-${c.word}`} style={[styles.item, { color: t.ink }]}>
            <Text style={{ color: t.ok }}>✓ </Text>
            {c.word}
          </Text>
        ))}
        {skipped.map((c) => (
          <Text key={`s-${c.word}`} style={[styles.item, { color: t.muted }]}>
            – {c.word}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={onHome}
          style={[styles.button, { flex: 1, backgroundColor: t.card, borderColor: t.line }]}
        >
          <Text style={[styles.buttonText, { color: t.ink }]}>Settings</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onPlayAgain}
          style={[styles.button, { flex: 1.6, backgroundColor: t.accent, borderColor: t.accent }]}
        >
          <Text style={[styles.buttonText, { color: t.onSolid }]}>Play again</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, gap: 20 },
  summary: { alignItems: 'center', gap: 4, paddingTop: 24 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  big: { fontSize: 72, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sub: { fontSize: 16 },
  list: { flex: 1 },
  listInner: { gap: 8, paddingVertical: 8 },
  item: { fontSize: 17 },
  controls: { flexDirection: 'row', gap: 12 },
  button: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
});
