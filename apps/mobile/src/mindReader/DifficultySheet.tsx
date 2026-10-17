import { difficultyApplyLabel, en } from '@unspoken/content';
import { toggleDifficulty, type GameSettings } from '@unspoken/core';
import { space } from '@unspoken/design-tokens';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DifficultyTiles } from '../setup/DifficultyTiles';
import { Button, ButtonPair } from '../ui/Button';
import { Sheet, SheetHeader } from '../ui/Sheet';

type Props = {
  visible: boolean;
  settings: GameSettings;
  onClose: () => void;
  // Plays the picked difficulties (Quick Play starts a new word with them).
  onApply: (settings: GameSettings) => void;
  // Custom settings: the Custom game setup. Left out (Versus's Game settings), the sheet has one
  // button that keeps the picks.
  onCustom?: () => void;
  // The i beside "Pick one or more", with the picks so far (Versus's Game settings).
  onInfo?: (settings: GameSettings) => void;
};

// The difficulty-only sheet: the setup's multi-select difficulty tiles. Quick Play has Custom
// settings on the left and Apply difficulty on the right; Versus's Game settings has Done.
export function DifficultySheet({ visible, settings, onClose, onApply, onCustom, onInfo }: Props) {
  const q = en.mindReader.quick;
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);
  if (visible !== open) {
    setOpen(visible);
    if (visible) setDraft(settings);
  }
  const { difficulties, categories } = draft;
  const apply = () => {
    onApply(draft);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <View style={styles.body}>
          <SheetHeader title={q.sheetTitle} colors={colors} onClose={onClose} />
          <DifficultyTiles
            picked={difficulties}
            categories={categories}
            colors={colors}
            gap={space[3]}
            onToggle={(d) => setDraft((cur) => toggleDifficulty(cur, d))}
            onInfo={onInfo ? () => onInfo(draft) : undefined}
          />
          {onCustom ? (
            <ButtonPair
              style={styles.footer}
              secondary={{ label: q.custom, colors, onPress: onCustom }}
              primary={{ label: difficultyApplyLabel(difficulties), colors, onPress: apply }}
            />
          ) : (
            <Button kind="primary" label={en.versus.settings.difficultyDone} colors={colors} onPress={apply} style={styles.footer} />
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // The tiles sit close under the title; the buttons get room above them.
  body: { gap: space[1] },
  footer: { marginTop: space[6] },
});
