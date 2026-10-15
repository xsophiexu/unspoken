import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MODES } from '../game';
import { font, type Theme } from '../theme';
import type { ModeId } from '../types';

type Props = {
  current: ModeId;
  theme: Theme;
  onNext: (mode: ModeId) => void;
};

// The "Change mode · Tile grid" board from the design canvas. Tapping a mode goes straight to its New game setup.
export function ModesScreen({ current, theme: t, onNext }: Props) {

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, font(800), { color: t.ink }]}>Modes</Text>
        <Text style={[styles.hint, font(500), { color: t.muted }]}>Tap a mode to set up a game</Text>
        <View style={styles.grid}>
          {MODES.map((m) => {
            const on = m.id === current;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: !m.available }}
                disabled={!m.available}
                onPress={() => onNext(m.id)}
                style={[
                  styles.tile,
                  { backgroundColor: on ? t.accent : t.tile, opacity: m.available ? 1 : 0.55 },
                ]}
              >
                <Text style={[styles.name, font(800), { color: on ? t.onAccent : t.ink }]}>{m.name}</Text>
                <Text style={[styles.sub, font(500), { color: on ? t.onAccentMuted : t.muted }]}>
                  {m.available ? m.sub : 'Coming soon'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  scroll: { paddingBottom: 20 },
  title: { fontSize: 28, paddingHorizontal: 4 },
  hint: { fontSize: 14, paddingHorizontal: 4, marginTop: 2 },
  grid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.5%',
    minHeight: 92,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
  },
  name: { fontSize: 16 },
  sub: { fontSize: 12 },
});
