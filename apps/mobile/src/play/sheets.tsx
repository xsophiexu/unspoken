import { difficultyApplyLabel, en } from '@unspoken/content';
import { DIFFICULTY_IDS, format, toggleDifficulty, type GameSettings } from '@unspoken/core';
import { gameMenu, layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useState } from 'react';
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
  settings: GameSettings;
  // Apply starts a new round with the picked difficulties (one or more).
  onApply: (settings: GameSettings) => void;
  onRestart: () => void;
  onNewGame: () => void;
};

// The sheet from the header pill: change the difficulties, restart, or a new game. The difficulty
// tiles add or remove picks like the setup's; Apply appears once they change.
export function ModeSheet({ visible, onClose, settings, onApply, onRestart, onNewGame }: ModeSheetProps) {
  const s = en.modeSheet;
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);
  if (visible !== open) {
    setOpen(visible);
    if (visible) setDraft(settings);
  }
  const changed = draft.difficulties.join() !== settings.difficulties.join();
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={en.modes[settings.mode].name} note={s.note} colors={colors} />
          <SectionLabel label={s.difficulty} colors={colors} />
          <Grid columns={layout.grid.sheetDifficulty} gap={space[2]}>
            {DIFFICULTY_IDS.map((d) => (
              <Tile
                key={d}
                title={en.difficulties[d].name}
                colors={colors}
                selected={draft.difficulties.includes(d)}
                onPress={() => setDraft((cur) => toggleDifficulty(cur, d))}
                height={layout.control.levelTile}
                centered
                checkbox
              />
            ))}
          </Grid>
          {changed ? <Button kind="primary" label={difficultyApplyLabel(draft.difficulties)} colors={colors} onPress={() => onApply(draft)} style={styles.gapAbove} /> : null}
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

const styles = StyleSheet.create({
  gapAbove: { marginTop: space[3] },
  // Restart game and Resume share the row and stack once their labels no longer fit side by side.
  actions: { flexDirection: 'row', gap: space[2.5] },
  action: { flex: 1, borderRadius: radius.xl, padding: space[4], gap: space[5], minHeight: layout.control.modeTile },
  actionText: { gap: space[0.5] },
});
