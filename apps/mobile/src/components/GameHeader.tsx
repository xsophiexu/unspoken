import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, type Theme } from '../theme';

type Props = {
  theme: Theme;
  title: string;
  badge: string;
  subline: string;
  onBadge: () => void;
  onMenu: () => void;
};

// Mode name, tappable difficulty badge, a status line, and the ··· menu button.
export function GameHeader({ theme: t, title, badge, subline, onBadge, onMenu }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          <Text style={[styles.mode, font(800), { color: t.ink }]}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Difficulty ${badge}. Tap to change.`}
            onPress={onBadge}
            hitSlop={8}
            style={({ pressed }) => [styles.badge, { backgroundColor: t.accent, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.badgeText, font(800), { color: t.onAccent }]}>{badge}</Text>
            <Text style={[styles.caret, font(800), { color: t.onAccentMuted }]}>▾</Text>
          </Pressable>
        </View>
        <Text style={[styles.subline, font(500), { color: t.muted }]}>{subline}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        onPress={onMenu}
        style={[styles.menuButton, { backgroundColor: t.tile }]}
      >
        {[0, 1, 2].map((k) => (
          <View key={k} style={[styles.dot, { backgroundColor: t.ink }]} />
        ))}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 2 },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mode: { fontSize: 26, letterSpacing: -0.5 },
  badge: { borderRadius: 6, paddingLeft: 8, paddingRight: 6, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
  badgeText: { fontSize: 11, letterSpacing: 0.6 },
  caret: { fontSize: 9 },
  subline: { fontSize: 13, marginTop: 1 },
  menuButton: { width: 36, height: 36, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
