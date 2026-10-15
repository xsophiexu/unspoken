import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CATEGORIES, DIFFICULTIES, SKIP_OPTIONS, cardsFor, modeOf } from '../game';
import { font, type Theme } from '../theme';
import type { Category, Difficulty, GameSettings } from '../types';

type Props = {
  settings: GameSettings;
  theme: Theme;
  onStart: (settings: GameSettings) => void;
  onModes: () => void;
};

// Typed digits fill the clock from the right, like a microwave: 1, 14, 145 reads 1:45.
function digitsToSeconds(digits: string): number {
  const padded = digits.padStart(3, '0');
  const m = Number(padded.slice(0, -2));
  const s = Math.min(59, Number(padded.slice(-2)));
  return m * 60 + s;
}

function secondsToDigits(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}${s.toString().padStart(2, '0')}`.replace(/^0+/, '');
}

// The "New game" setup board from the design canvas.
export function SetupScreen({ settings, theme: t, onStart, onModes }: Props) {
  const mode = modeOf(settings.mode);
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty);
  const [category, setCategory] = useState<Category | null>(settings.category);
  const [digits, setDigits] = useState(secondsToDigits(settings.roundSeconds));
  const [skips, setSkips] = useState<number | null>(settings.skips);
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const deckSize = cardsFor(difficulty, category).length;

  const padded = digits.padStart(3, '0');
  const clock = `${Number(padded.slice(0, -2))}:${padded.slice(-2)}`;
  const seconds = digitsToSeconds(digits);
  const canStart = !mode.timed || seconds >= 10;

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable accessibilityRole="button" onPress={onModes} hitSlop={10}>
            <Text style={[styles.link, font(700), { color: t.accent }]}>← Modes</Text>
          </Pressable>
          <Text style={[styles.modeName, font(500), { color: t.muted }]}>{mode.name}</Text>
        </View>
        <Text style={[styles.title, font(800), { color: t.ink }]}>New game</Text>

        <Section t={t} label="DIFFICULTY">
          <View style={styles.diffGrid}>
            {DIFFICULTIES.map((d) => {
              const on = d.id === difficulty;
              return (
                <Pressable
                  key={d.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setDifficulty(d.id)}
                  style={[styles.diff, { backgroundColor: on ? t.accent : t.tile }]}
                >
                  <Text style={[styles.diffName, font(800), { color: on ? t.onAccent : t.ink }]}>{d.id}</Text>
                  <Text style={[styles.diffSub, font(500), { color: on ? t.onAccentMuted : t.muted }]}>
                    {cardsFor(d.id, category).length} cards
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section
          t={t}
          label="THEME"
          aside={deckSize < 20 ? `Only ${deckSize} cards, words will repeat` : undefined}
        >
          <View style={styles.themeWrap}>
            {([null, ...CATEGORIES] as (Category | null)[]).map((c) => {
              const on = c === category;
              return (
                <Pressable
                  key={c ?? 'all'}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setCategory(c)}
                  style={[styles.theme, { backgroundColor: on ? t.accent : t.tile }]}
                >
                  <Text style={[styles.themeName, font(700), { color: on ? t.onAccent : t.ink }]}>
                    {c ?? 'All cards'}
                  </Text>
                  <Text style={[styles.themeCount, font(600), { color: on ? t.onAccentMuted : t.muted }]}>
                    {cardsFor(difficulty, c).length}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {mode.timed ? (
          <Section t={t} label="ROUND TIMER" aside={seconds < 10 ? 'At least 0:10' : undefined}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Round timer ${clock}. Tap to type a new time.`}
              onPress={() => input.current?.focus()}
              style={[
                styles.timer,
                { backgroundColor: '#FFFFFF', borderColor: focused ? t.accent : 'transparent' },
              ]}
            >
              <View style={styles.timerValue}>
                <Text style={[styles.timerText, font(800), { color: t.ink }]}>{clock}</Text>
                {focused ? <View style={[styles.caret, { backgroundColor: t.accent }]} /> : null}
              </View>
              <Text style={[styles.timerHint, font(500), { color: t.muted }]}>min : sec</Text>
            </Pressable>
            <TextInput
              ref={input}
              value={digits}
              onChangeText={(v) => setDigits(v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 4))}
              keyboardType="number-pad"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={styles.hiddenInput}
              caretHidden
            />
          </Section>
        ) : null}

        {mode.scored ? (
          <Section t={t} label="SKIPS PER ROUND" aside="∞ = unlimited">
            <View style={styles.skipGrid}>
              {SKIP_OPTIONS.map((n) => {
                const on = n === skips;
                return (
                  <Pressable
                    key={String(n)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={n === null ? 'Unlimited skips' : `${n} skips`}
                    onPress={() => setSkips(n)}
                    style={[styles.skip, { backgroundColor: on ? t.accent : t.tile }]}
                  >
                    <Text style={[styles.skipText, font(700), { color: on ? t.onAccent : t.ink }]}>
                      {n === null ? '∞' : n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={!canStart}
        onPress={() => onStart({ ...settings, difficulty, category, roundSeconds: seconds, skips })}
        style={[styles.start, { backgroundColor: t.accent, opacity: canStart ? 1 : 0.5 }]}
      >
        <Text style={[styles.startText, font(700), { color: t.onAccent }]}>Start game</Text>
      </Pressable>
    </View>
  );
}

function Section({ t, label, aside, children }: { t: Theme; label: string; aside?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionLabel, font(700), { color: t.muted }]}>{label}</Text>
        {aside ? <Text style={[styles.aside, font(500), { color: t.muted }]}>{aside}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  scroll: { paddingBottom: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontSize: 15 },
  modeName: { fontSize: 13 },
  title: { marginTop: 14, fontSize: 30 },
  section: { marginTop: 22, gap: 10 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionLabel: { fontSize: 11, letterSpacing: 0.9 },
  aside: { fontSize: 13 },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diff: { width: '31%', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
  diffName: { fontSize: 16 },
  diffSub: { fontSize: 12, marginTop: 4 },
  themeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  theme: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeName: { fontSize: 14 },
  themeCount: { fontSize: 13 },
  timer: {
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerValue: { flexDirection: 'row', alignItems: 'center' },
  timerText: { fontSize: 28, fontVariant: ['tabular-nums'] },
  caret: { width: 2, height: 26, marginLeft: 3 },
  timerHint: { fontSize: 13 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  skipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skip: {
    width: '15.1%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 16 },
  start: { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 17 },
});
