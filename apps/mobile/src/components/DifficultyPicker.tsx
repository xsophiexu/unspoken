import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DIFFICULTIES, cardsFor } from '../game';
import { tileNameSize } from '../fitWord';
import { font, type Theme } from '../theme';
import type { Category, Difficulty } from '../types';
import { count } from '@unspoken/core';

type Props = {
  visible: boolean;
  theme: Theme;
  current: Difficulty;
  categories: readonly Category[];
  onPick: (difficulty: Difficulty) => void;
  onClose: () => void;
};

// Opens from the difficulty badge on the play screen. Picking a level starts a new game at that level.
export function DifficultyPicker({ visible, theme: t, current, categories, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close difficulty" />
      <View style={[styles.sheet, { backgroundColor: t.bg, paddingBottom: 20 + insets.bottom }]}>
        <View style={[styles.grabber, { backgroundColor: t.outline }]} />
        <Text style={[styles.title, font(800), { color: t.ink }]}>Difficulty</Text>
        <Text style={[styles.sub, font(500), { color: t.muted }]}>Picking a new level starts a new game</Text>
        <View style={styles.grid}>
          {DIFFICULTIES.map((d) => {
            const on = d.id === current;
            return (
              <Pressable
                key={d.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => (on ? onClose() : onPick(d.id))}
                style={[styles.tile, { backgroundColor: on ? t.accent : t.tile }]}
              >
                <Text
                  style={[styles.name, font(800), { color: on ? t.onAccent : t.ink, fontSize: tileNameSize(d.id, width) }]}
                  numberOfLines={1}
                >
                  {d.id}
                </Text>
                <Text style={[styles.count, font(500), { color: on ? t.onAccentMuted : t.muted }]}>
                  {count(cardsFor(d.id, categories).length, 'card')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={[styles.cancel, { borderColor: t.outline }]}
        >
          <Text style={[styles.cancelText, font(700), { color: t.ink }]}>Keep playing</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20, 30, 30, 0.35)' },
  sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', marginTop: 'auto', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 12, opacity: 0.6 },
  title: { fontSize: 24 },
  sub: { fontSize: 14 },
  grid: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31%', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
  name: { fontSize: 16 },
  count: { fontSize: 12, marginTop: 4 },
  cancel: { marginTop: 14, height: 54, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16 },
});
