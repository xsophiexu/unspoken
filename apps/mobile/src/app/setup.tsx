import { bank, en } from '@unspoken/content';
import {
  DIFFICULTY_IDS,
  MODE_IDS,
  canStart,
  categoriesInBank,
  deckSize,
  format,
  formatClock,
  gameConfig,
  hasSkipSetting,
  hasTimeLimit,
  hasTimerSetting,
  isTimeLimitInRange,
  modeRules,
  plural,
  sanitizeTimerDigits,
  secondsToTimerDigits,
  timerDigitsLabel,
  timerDigitsToSeconds,
  toggleCategory,
  withDifficulty,
  type GameSettings,
  type ModeId,
} from '@unspoken/core';
import { layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { backToGame, goBack } from '../nav';
import { usePrefs } from '../state/prefs';
import { Button, LinkButton } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Grid } from '../ui/Grid';
import { Icon } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { Screen, ScreenTitle, ScreenTop, SectionLabel } from '../ui/Screen';
import { Tile } from '../ui/Tile';
import { Txt } from '../ui/Txt';

const THEMES = categoriesInBank(bank);

function modeParam(value: unknown, fallback: ModeId): ModeId {
  return MODE_IDS.find((id) => id === value && modeRules(id).available) ?? fallback;
}

// New game: difficulty, themes, and the timer and skips when the mode has them.
export default function SetupScreen() {
  const prefs = usePrefs();
  const { mode: param } = useLocalSearchParams<{ mode?: string }>();
  const mode = modeParam(param, prefs.settings.mode);
  const [draft, setDraft] = useState<GameSettings>(() => ({ ...prefs.settings, mode }));
  const settings = { ...draft, mode };
  const s = en.setup;

  const counts = useMemo(() => DIFFICULTY_IDS.map((d) => deckSize(bank, d, draft.categories)), [draft.categories]);
  const themeCounts = useMemo(() => THEMES.map((c) => deckSize(bank, draft.difficulties, [c])), [draft.difficulties]);
  const allCount = deckSize(bank, draft.difficulties, []);
  const cards = deckSize(bank, draft.difficulties, draft.categories);

  const start = () => {
    if (!canStart(settings)) return;
    prefs.startGame(settings);
    backToGame();
  };

  return (
    <Screen
      tone="base"
      width="column"
      footer={(colors) => <Button kind="primary" label={s.start} colors={colors} disabled={!canStart(settings)} onPress={start} />}
    >
      {(colors) => (
        <>
          <ScreenTop
            left={<LinkButton label={s.back} colors={colors} onPress={goBack} />}
            right={
              <Txt variant="hint" color={colors.muted}>
                {en.modes[mode].name}
              </Txt>
            }
          />
          <ScreenTitle title={s.title} colors={colors} />

          <View style={styles.section}>
            <SectionLabel label={s.difficulty} colors={colors} />
            <Grid columns={layout.grid.setupDifficulty} gap={space[2]}>
              {DIFFICULTY_IDS.map((d, i) => (
                <Tile
                  key={d}
                  title={en.difficulties[d].name}
                  detail={plural(counts[i] ?? 0, en.units.cards)}
                  colors={colors}
                  selected={draft.difficulties.includes(d)}
                  onPress={() => setDraft((cur) => withDifficulty(cur, d))}
                />
              ))}
            </Grid>
          </View>

          <View style={styles.section}>
            <SectionLabel
              label={s.themes}
              aside={cards < gameConfig.smallDeckCards ? format(s.smallDeck, { cards: plural(cards, en.units.cards) }) : s.themesHint}
              colors={colors}
            />
            <View style={styles.chips}>
              <Chip
                label={en.themes.all}
                count={allCount}
                colors={colors}
                selected={draft.categories.length === 0}
                onPress={() => setDraft((cur) => ({ ...cur, categories: toggleCategory(cur.categories, null) }))}
              />
              {THEMES.map((c, i) => (
                <Chip
                  key={c}
                  role="checkbox"
                  label={en.categories[c]}
                  count={themeCounts[i]}
                  colors={colors}
                  selected={draft.categories.includes(c)}
                  onPress={() => setDraft((cur) => ({ ...cur, categories: toggleCategory(cur.categories, c) }))}
                />
              ))}
            </View>
          </View>

          {hasTimerSetting(mode) ? (
            <TimerField
              seconds={draft.roundSeconds}
              noTimeLimit={draft.noTimeLimit}
              colors={colors}
              onChange={(roundSeconds) => setDraft((cur) => ({ ...cur, roundSeconds }))}
              onNoTimeLimit={(noTimeLimit) => setDraft((cur) => ({ ...cur, noTimeLimit }))}
            />
          ) : null}

          {hasSkipSetting(mode) ? (
            <View style={styles.section}>
              <SectionLabel label={s.skips} aside={s.skipsHint} colors={colors} />
              <Grid columns={layout.grid.skips} gap={space[2]}>
                {gameConfig.skipOptions.map((n) => (
                  <Tile
                    key={String(n)}
                    title={n === null ? s.unlimited : String(n)}
                    accessibilityLabel={n === null ? en.a11y.unlimitedSkips : plural(n, en.units.skips)}
                    colors={colors}
                    selected={n === draft.skips}
                    onPress={() => setDraft((cur) => ({ ...cur, skips: n }))}
                    height={layout.minTouch}
                    centered
                  />
                ))}
              </Grid>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

type TimerProps = {
  seconds: number;
  noTimeLimit: boolean;
  colors: RegionColors;
  onChange: (seconds: number) => void;
  onNoTimeLimit: (on: boolean) => void;
};

const LIMITS = { min: formatClock(gameConfig.minRoundSeconds), max: formatClock(gameConfig.maxRoundSeconds) };

// The time limit fills from the right as digits are typed, like a microwave: 1, 4, 5 reads 1:45.
// Once the box loses focus, seconds over 59 roll into minutes (1:75 reads 2:15) and a time outside
// the accepted range shows a calm note; Start waits until it is fixed. The No limit switch sits on
// the label row; on, it greys the box out and keeps its time, so turning it off brings it back.
function TimerField({ seconds, noTimeLimit, colors, onChange, onNoTimeLimit }: TimerProps) {
  const { theme } = usePrefs();
  const field = theme.regions.raised;
  const input = useRef<TextInput>(null);
  const [digits, setDigits] = useState(() => secondsToTimerDigits(seconds));
  const [focused, setFocused] = useState(false);
  const label = timerDigitsLabel(digits);
  const s = en.setup;
  const outOfRange = !noTimeLimit && !focused && !isTimeLimitInRange(seconds);
  const ink = noTimeLimit ? colors.disabledInk : field.ink;
  const unitInk = noTimeLimit ? colors.disabledInk : field.muted;
  // A new difficulty moves a default time with it, and a typed 1:75 settles as 2:15; show that time.
  if (!focused && digits !== secondsToTimerDigits(seconds)) setDigits(secondsToTimerDigits(seconds));

  return (
    <View style={styles.section}>
      <View style={styles.timerHead}>
        <Txt variant="overline" color={colors.muted} accessibilityRole="header">
          {s.timer}
        </Txt>
        <Press
          onPress={() => onNoTimeLimit(!noTimeLimit)}
          accessibilityRole="switch"
          accessibilityLabel={en.a11y.noTimeLimit}
          accessibilityState={{ checked: noTimeLimit }}
          hitSlop={slopFor(space[4.5])}
          style={styles.noLimit}
        >
          <Txt variant="subline" color={colors.muted}>
            {s.noLimit}
          </Txt>
          {/* Drawn rather than the platform Switch, so it looks the same on iOS, Android and web. */}
          <View style={[styles.track, noTimeLimit ? styles.trackOn : null, { backgroundColor: noTimeLimit ? colors.accent : colors.track }]}>
            <View style={[styles.thumb, { backgroundColor: field.bg }]} />
          </View>
        </Press>
      </View>
      <Press
        onPress={() => input.current?.focus()}
        disabled={noTimeLimit}
        fadeDisabled={false}
        accessibilityLabel={format(en.a11y.timer, { clock: label })}
        style={[
          styles.timer,
          noTimeLimit
            ? { backgroundColor: colors.disabled, borderColor: colors.disabled }
            : { backgroundColor: field.bg, borderColor: focused ? colors.accent : outOfRange ? colors.ink : field.bg },
        ]}
      >
        <Txt variant="headline" color={ink} style={styles.tabular}>
          {label}
        </Txt>
        {noTimeLimit ? (
          <Txt variant="hint" color={unitInk} style={styles.timerSide}>
            {s.noClock}
          </Txt>
        ) : (
          <View style={styles.timerSide}>
            <Txt variant="hint" color={unitInk} style={styles.end}>
              {s.timerUnit}
            </Txt>
            <Txt variant="small" color={unitInk} style={styles.end}>
              {format(s.timerRange, LIMITS)}
            </Txt>
          </View>
        )}
      </Press>
      <TextInput
        ref={input}
        value={digits}
        onChangeText={(text) => {
          const next = sanitizeTimerDigits(text);
          setDigits(next);
          onChange(timerDigitsToSeconds(next));
        }}
        keyboardType="number-pad"
        editable={!noTimeLimit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        style={styles.hiddenInput}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      {outOfRange ? <Note text={format(s.timerOutOfRange, LIMITS)} colors={colors} /> : null}
    </View>
  );
}

// A calm note: muted ink on a soft grey row with a small info icon. Never red.
function Note({ text, colors }: { text: string; colors: RegionColors }) {
  return (
    <View style={[styles.note, { backgroundColor: colors.chip }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="info" size={layout.icon.sm} color={colors.muted} />
      <Txt variant="hint" color={colors.muted} style={styles.noteText}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2.5] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  timer: {
    minHeight: layout.control.input.height + space[6],
    borderRadius: radius.lg,
    borderWidth: layout.stroke.focus,
    paddingHorizontal: space[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabular: { fontVariant: ['tabular-nums'] },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  note: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderRadius: radius.md, paddingHorizontal: space[3.5], paddingVertical: space[2.5] },
  noteText: { flex: 1 },
  timerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3] },
  noLimit: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  timerSide: { flexShrink: 1, maxWidth: '45%', alignItems: 'flex-end', textAlign: 'right' },
  end: { textAlign: 'right' },
  // The No limit switch, small enough to sit on the label row.
  track: { width: space[8], height: space[4.5], borderRadius: radius.pill, padding: space[0.5], alignItems: 'flex-start' },
  trackOn: { alignItems: 'flex-end' },
  thumb: { width: space[3.5], height: space[3.5], borderRadius: radius.pill },
});
