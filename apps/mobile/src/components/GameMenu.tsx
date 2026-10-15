import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MODES } from '../game';
import { THEMES, font, type Theme } from '../theme';
import type { ModeId } from '../types';

type Props = {
  visible: boolean;
  theme: Theme;
  status: string;
  modeId: ModeId;
  onResume: () => void;
  onRestart: () => void;
  onChangeSettings: () => void;
  onChangeTheme: (index: number) => void;
};

// The sheet that opens from the ··· button (the "Game menu" board in the design canvas).
export function GameMenu({
  visible,
  theme: t,
  status,
  modeId,
  onResume,
  onRestart,
  onChangeSettings,
  onChangeTheme,
}: Props) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'main' | 'theme'>('main');
  const mode = MODES.find((m) => m.id === modeId);

  const close = () => {
    setView('main');
    onResume();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close menu" />
      <View style={[styles.sheet, { backgroundColor: t.bg, paddingBottom: 20 + insets.bottom }]}>
        <View style={[styles.grabber, { backgroundColor: t.outline }]} />

        {view === 'main' && (
          <>
            <Text style={[styles.title, font(800), { color: t.ink }]}>Game paused</Text>
            <Text style={[styles.sub, font(500), { color: t.muted }]}>{status}</Text>
            <View style={styles.rows}>
              <Row
                t={t}
                title="Restart game"
                detail="New words, score back to 0"
                onPress={() => {
                  setView('main');
                  onRestart();
                }}
              />
              <Row
                t={t}
                title="Change settings"
                detail={`Mode, difficulty and theme · ${mode?.name ?? ''}`}
                chevron
                onPress={() => {
                  setView('main');
                  onChangeSettings();
                }}
              />
              <Row
                t={t}
                title="Change colors"
                detail={THEMES.find((x) => x.name === t.name)?.name ?? ''}
                chevron
                onPress={() => setView('theme')}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={[styles.primary, { backgroundColor: t.accent }]}
            >
              <Text style={[styles.primaryText, font(700), { color: t.onAccent }]}>Resume</Text>
            </Pressable>
          </>
        )}

        {view === 'theme' && (
          <>
            <Back t={t} title="Change colors" onPress={() => setView('main')} />
            <View style={styles.rows}>
              {THEMES.map((x, i) => (
                <Pressable
                  key={x.name}
                  accessibilityRole="button"
                  onPress={() => onChangeTheme(i)}
                  style={[styles.row, { backgroundColor: t.tile }]}
                >
                  <View style={styles.swatches}>
                    <View style={[styles.swatch, { backgroundColor: x.bg }]} />
                    <View style={[styles.swatch, { backgroundColor: x.tile }]} />
                    <View style={[styles.swatch, { backgroundColor: x.accent }]} />
                  </View>
                  <Text style={[styles.rowTitle, styles.rowText, font(700), { color: t.ink }]}>{x.name}</Text>
                  {x.name === t.name ? <Text style={[styles.check, font(800), { color: t.accent }]}>✓</Text> : null}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

function Row({
  t,
  title,
  detail,
  chevron,
  onPress,
}: {
  t: Theme;
  title: string;
  detail: string;
  chevron?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, { backgroundColor: t.tile }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, font(700), { color: t.ink }]}>{title}</Text>
        <Text style={[styles.rowDetail, font(500), { color: t.muted }]}>{detail}</Text>
      </View>
      {chevron ? <Text style={[styles.chevron, font(700), { color: t.muted }]}>›</Text> : null}
    </Pressable>
  );
}

function Back({ t, title, onPress }: { t: Theme; title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.back} hitSlop={10}>
      <Text style={[styles.backText, font(700), { color: t.accent }]}>‹ Back</Text>
      <Text style={[styles.title, font(800), { color: t.ink }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20, 30, 30, 0.35)' },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginTop: 'auto',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 6,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 12, opacity: 0.6 },
  title: { fontSize: 24 },
  sub: { fontSize: 14 },
  rows: { gap: 8, marginTop: 14 },
  row: {
    minHeight: 64,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16 },
  rowDetail: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 24 },
  check: { fontSize: 18 },
  swatches: { flexDirection: 'row', gap: 4 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  primary: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { fontSize: 17 },
  back: { gap: 6 },
  backText: { fontSize: 15 },
});
