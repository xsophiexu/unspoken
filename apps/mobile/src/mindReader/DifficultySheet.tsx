import { bank, difficultyApplyLabel, difficultyPickNote, en } from '@unspoken/content';
import { deckSize, plural, toggleDifficulty, DIFFICULTY_IDS, type GameSettings } from '@unspoken/core';
import { layout, space } from '@unspoken/design-tokens';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ButtonPair } from '../ui/Button';
import { Grid } from '../ui/Grid';
import { SectionLabel } from '../ui/Screen';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { Tile } from '../ui/Tile';

type Props = {
  visible: boolean;
  settings: GameSettings;
  onClose: () => void;
  // Plays the picked difficulties (Quick Play starts a new word with them).
  onApply: (settings: GameSettings) => void;
  // Custom settings: the Custom game setup.
  onCustom: () => void;
};

// Quick Play's difficulty-only sheet: the setup's multi-select difficulty tiles, Custom settings on
// the left and Apply difficulty on the right.
export function DifficultySheet({ visible, settings, onClose, onApply, onCustom }: Props) {
  const q = en.mindReader.quick;
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);
  if (visible !== open) {
    setOpen(visible);
    if (visible) setDraft(settings);
  }
  const { difficulties, categories } = draft;
  const cards = deckSize(bank, difficulties, categories);
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <View style={styles.body}>
          <SheetHeader title={q.sheetTitle} colors={colors} onClose={onClose} />
          <View style={styles.section}>
            <SectionLabel label={en.setup.difficulty} aside={difficultyPickNote(difficulties, cards)} colors={colors} />
            <Grid columns={layout.grid.setupDifficulty} gap={space[2]}>
              {DIFFICULTY_IDS.map((d) => (
                <Tile
                  key={d}
                  checkbox
                  title={en.difficulties[d].name}
                  detail={plural(deckSize(bank, d, categories), en.units.cards)}
                  colors={colors}
                  selected={difficulties.includes(d)}
                  onPress={() => setDraft((cur) => toggleDifficulty(cur, d))}
                />
              ))}
            </Grid>
          </View>
          <ButtonPair
            style={styles.footer}
            secondary={{ label: q.custom, colors, onPress: onCustom }}
            primary={{
              label: difficultyApplyLabel(difficulties),
              colors,
              onPress: () => {
                onApply(draft);
                onClose();
              },
            }}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // The tiles sit close under the title; the buttons get room above them.
  body: { gap: space[1] },
  section: { gap: space[3] },
  footer: { marginTop: space[6] },
});
