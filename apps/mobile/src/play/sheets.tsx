import { bank, en } from '@unspoken/content';
import { DIFFICULTY_IDS, deckSize, format, plural, type Category, type Difficulty, type ModeId } from '@unspoken/core';
import { layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button } from '../ui/Button';
import { Grid } from '../ui/Grid';
import { Icon, type IconName } from '../ui/Icon';
import { Press } from '../ui/Press';
import { SectionLabel } from '../ui/Screen';
import { Sheet, SheetHeader, SheetRow } from '../ui/Sheet';
import { Tile } from '../ui/Tile';
import { Txt } from '../ui/Txt';

type MenuProps = {
  visible: boolean;
  onClose: () => void;
  mode: ModeId;
  // core menuStatus: "1:42 left · 7 pts · All cards"
  status: string;
  onRestart: () => void;
  onSettings: () => void;
  onCustomize: () => void;
  onFeedback: () => void;
  onHowToPlay: () => void;
};

// The ··· menu ("Game paused"). Styles with a sliders button list Customize first.
export function GameMenu({ visible, onClose, mode, status, onRestart, onSettings, onCustomize, onFeedback, onHowToPlay }: MenuProps) {
  const { theme } = usePrefs();
  const m = en.menu;
  const customize = { key: 'customize', icon: 'sliders', title: m.customize.title, detail: format(m.customize.detail, { style: en.customize.styles[theme.style.id], color: en.customize.colors[theme.color] }), onPress: onCustomize, chevron: true } as const;
  const rows = [
    { key: 'restart', icon: 'restart', title: m.restart.title, detail: m.restart.detail, onPress: onRestart, chevron: false },
    { key: 'settings', icon: 'newGame', title: m.changeSettings.title, detail: format(m.changeSettings.detail, { mode: en.modes[mode].name }), onPress: onSettings, chevron: true },
    customize,
    { key: 'feedback', icon: 'bubble', title: m.feedback.title, detail: m.feedback.detail, onPress: onFeedback, chevron: true },
    { key: 'howToPlay', icon: 'play', title: m.howToPlay.title, detail: m.howToPlay.detail, onPress: onHowToPlay, chevron: false },
  ] satisfies { key: string; icon: IconName; title: string; detail: string; onPress: () => void; chevron: boolean }[];
  const ordered = theme.style.header.menu === 'sliders' ? [customize, ...rows.filter((r) => r !== customize)] : rows;
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={m.title} sub={status} colors={colors} onClose={onClose} />
          {ordered.map(({ key, ...row }) => (
            <SheetRow key={key} colors={colors} {...row} />
          ))}
          <Button kind="primary" label={m.resume} colors={colors} onPress={onClose} style={styles.gapAbove} />
        </>
      )}
    </Sheet>
  );
}

type ModeSheetProps = {
  visible: boolean;
  onClose: () => void;
  mode: ModeId;
  difficulty: Difficulty;
  onPick: (difficulty: Difficulty) => void;
  onRestart: () => void;
  onNewGame: () => void;
};

// The sheet from the header pill: pick a level (starts a new round), restart, or a new game.
export function ModeSheet({ visible, onClose, mode, difficulty, onPick, onRestart, onNewGame }: ModeSheetProps) {
  const s = en.modeSheet;
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={en.modes[mode].name} note={s.note} colors={colors} />
          <SectionLabel label={s.difficulty} colors={colors} />
          <Grid columns={layout.grid.sheetDifficulty} gap={space[2]}>
            {DIFFICULTY_IDS.map((d) => (
              <Tile key={d} title={en.difficulties[d].name} colors={colors} selected={d === difficulty} onPress={() => onPick(d)} height={layout.control.levelTile} centered />
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
  difficulty: Difficulty;
  categories: readonly Category[];
  onPick: (difficulty: Difficulty) => void;
};

// Card's level badge opens this: every level with how many cards it has for the chosen themes.
export function DifficultyPicker({ visible, onClose, difficulty, categories, onPick }: PickerProps) {
  const p = en.difficultyPicker;
  const counts = useMemo(() => DIFFICULTY_IDS.map((d) => deckSize(bank, d, categories)), [categories]);
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={p.title} sub={p.note} colors={colors} />
          <Grid columns={layout.grid.setupDifficulty} gap={space[2]}>
            {DIFFICULTY_IDS.map((d, i) => (
              <Tile key={d} title={en.difficulties[d].name} detail={plural(counts[i] ?? 0, en.units.cards)} colors={colors} selected={d === difficulty} onPress={() => onPick(d)} />
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
  actions: { flexDirection: 'row', gap: space[2.5] },
  action: { flex: 1, borderRadius: radius.xl, padding: space[4], gap: space[5], minHeight: layout.control.modeTile },
  actionText: { gap: space[0.5] },
});
