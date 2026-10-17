import { bank, en } from '@unspoken/content';
import { DIFFICULTY_IDS, deckSize, format, plural, type Category, type Difficulty, type ModeId } from '@unspoken/core';
import { gameMenu, layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button, ButtonPair } from '../ui/Button';
import { Grid } from '../ui/Grid';
import { Icon, type IconName } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { SectionLabel } from '../ui/Screen';
import { Sheet, SheetHeader, SheetRow } from '../ui/Sheet';
import { Tile } from '../ui/Tile';
import { Txt } from '../ui/Txt';

type MenuProps = {
  visible: boolean;
  onClose: () => void;
  // core menuStatus: "1:42 left · 7 pts · All cards"
  status: string;
  onRestart: () => void;
  onSettings: () => void;
  onCustomize: () => void;
  onFeedback: () => void;
  onHowToPlay: () => void;
};

// The ··· menu ("Game paused"): an i for How to play beside the title, rows for settings, customize
// and feedback, then Resume. Restart sits beside Resume (the narrower of the pair) or, with
// gameMenu.restartPlacement 'header', as a compact button at the top right. Styles with a sliders
// button list Customize first.
export function GameMenu({ visible, onClose, status, onRestart, onSettings, onCustomize, onFeedback, onHowToPlay }: MenuProps) {
  const { theme } = usePrefs();
  const m = en.menu;
  const customize = { key: 'customize', icon: 'sliders', title: m.customize.title, detail: format(m.customize.detail, { style: en.customize.styles[theme.style.id], color: en.customize.colors[theme.color] }), onPress: onCustomize } as const;
  const rows = [
    { key: 'settings', icon: 'newGame', title: m.changeSettings.title, detail: m.changeSettings.detail, onPress: onSettings },
    customize,
    { key: 'feedback', icon: 'bubble', title: m.feedback.title, detail: m.feedback.detail, onPress: onFeedback },
  ] satisfies { key: string; icon: IconName; title: string; detail: string; onPress: () => void }[];
  const ordered = theme.style.header.menu === 'sliders' ? [customize, ...rows.filter((r) => r !== customize)] : rows;
  const inHeader = gameMenu.restartPlacement === 'header';
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader
            title={m.title}
            sub={status}
            colors={colors}
            action={
              <Press onPress={onHowToPlay} accessibilityLabel={m.howToPlay.title} hitSlop={slopFor(layout.icon.md)}>
                <Icon name="info" size={layout.icon.md} color={colors.muted} />
              </Press>
            }
            end={
              inHeader ? <Button size="compact" icon="restart" label={m.restartShort} accessibilityLabel={m.restart} colors={colors} onPress={onRestart} /> : undefined
            }
          />
          {ordered.map(({ key, ...row }) => (
            <SheetRow key={key} colors={colors} chevron {...row} />
          ))}
          {inHeader ? (
            <Button kind="primary" icon="play" label={m.resume} colors={colors} onPress={onClose} style={styles.gapAbove} />
          ) : (
            <ButtonPair
              secondary={{ icon: 'restart', label: m.restartShort, accessibilityLabel: m.restart, colors, onPress: onRestart }}
              primary={{ icon: 'play', label: m.resume, colors, onPress: onClose }}
              style={styles.gapAbove}
            />
          )}
        </>
      )}
    </Sheet>
  );
}

type ModeSheetProps = {
  visible: boolean;
  onClose: () => void;
  mode: ModeId;
  // Every pick is highlighted; picking one plays just that difficulty.
  difficulties: readonly Difficulty[];
  onPick: (difficulty: Difficulty) => void;
  onRestart: () => void;
  onNewGame: () => void;
};

// The sheet from the header pill: pick a level (starts a new round), restart, or a new game.
export function ModeSheet({ visible, onClose, mode, difficulties, onPick, onRestart, onNewGame }: ModeSheetProps) {
  const s = en.modeSheet;
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={en.modes[mode].name} note={s.note} colors={colors} />
          <SectionLabel label={s.difficulty} colors={colors} />
          <Grid columns={layout.grid.sheetDifficulty} gap={space[2]}>
            {DIFFICULTY_IDS.map((d) => (
              <Tile key={d} title={en.difficulties[d].name} colors={colors} selected={difficulties.includes(d)} onPress={() => onPick(d)} height={layout.control.levelTile} centered />
            ))}
          </Grid>
          <View style={[styles.actions, styles.gapAbove]}>
            <ActionTile icon="restart" title={s.restart.title} detail={s.restart.detail} colors={colors} onPress={onRestart} />
            <ActionTile icon="newGame" title={s.newGame.title} detail={s.newGame.detail} colors={colors} onPress={onNewGame} primary />
          </View>
          <Button label={s.keepPlaying} colors={colors} onPress={onClose} style={styles.gapAbove} />
        </>
      )}
    </Sheet>
  );
}

function ActionTile({ icon, title, detail, colors, onPress, primary }: { icon: IconName; title: string; detail: string; colors: RegionColors; onPress: () => void; primary?: boolean }) {
  const ink = primary ? colors.onAccent : colors.chipInk;
  return (
    <Press onPress={onPress} accessibilityLabel={title} accessibilityHint={detail} style={[styles.action, { backgroundColor: primary ? colors.accent : colors.chip }]}>
      <Icon name={icon} size={layout.icon.md} color={ink} />
      <View style={styles.actionText}>
        <Txt variant="optionTitle" color={ink}>
          {title}
        </Txt>
        <Txt variant="small" color={primary ? colors.onAccent : colors.muted}>
          {detail}
        </Txt>
      </View>
    </Press>
  );
}

type PickerProps = {
  visible: boolean;
  onClose: () => void;
  // Every pick is highlighted; picking one plays just that difficulty.
  difficulties: readonly Difficulty[];
  categories: readonly Category[];
  onPick: (difficulty: Difficulty) => void;
};

// Card's level badge opens this: every level with how many cards it has for the chosen themes.
export function DifficultyPicker({ visible, onClose, difficulties, categories, onPick }: PickerProps) {
  const p = en.difficultyPicker;
  const counts = useMemo(() => DIFFICULTY_IDS.map((d) => deckSize(bank, d, categories)), [categories]);
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={p.title} sub={p.note} colors={colors} />
          <Grid columns={layout.grid.setupDifficulty} gap={space[2]}>
            {DIFFICULTY_IDS.map((d, i) => (
              <Tile key={d} title={en.difficulties[d].name} detail={plural(counts[i] ?? 0, en.units.cards)} colors={colors} selected={difficulties.includes(d)} onPress={() => onPick(d)} />
            ))}
          </Grid>
          <Button label={p.keepPlaying} colors={colors} onPress={onClose} style={styles.gapAbove} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gapAbove: { marginTop: space[3] },
  // Restart game and Resume share the row and stack once their labels no longer fit side by side.
  actions: { flexDirection: 'row', gap: space[2.5] },
  action: { flex: 1, borderRadius: radius.xl, padding: space[4], gap: space[5], minHeight: layout.control.modeTile },
  actionText: { gap: space[0.5] },
});
