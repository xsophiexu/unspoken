import { bank, difficultyPickNote, en } from '@unspoken/content';
import { DIFFICULTY_IDS, deckSize, plural, type Category, type Difficulty } from '@unspoken/core';
import { layout, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Grid } from '../ui/Grid';
import { Icon } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { Tile } from '../ui/Tile';
import { Txt } from '../ui/Txt';

type Props = {
  picked: readonly Difficulty[];
  categories: readonly Category[];
  colors: RegionColors;
  onToggle: (difficulty: Difficulty) => void;
  // The i at the right of the label opens About difficulties; left out, there is none.
  onInfo?: () => void;
  // Space between the label row and the tiles.
  gap?: number;
};

// DIFFICULTY with "Pick one or more" (or the picks and their cards) at the right, and the
// multi-select tiles with each one's card count. New game and the difficulty sheet both use it.
export function DifficultyTiles({ picked, categories, colors, onToggle, onInfo, gap = space[2.5] }: Props) {
  const cards = deckSize(bank, picked, categories);
  return (
    <View style={{ gap }}>
      <View style={styles.head}>
        <Txt variant="overline" color={colors.muted} accessibilityRole="header">
          {en.setup.difficulty}
        </Txt>
        <Txt variant="subline" color={colors.muted} style={styles.aside} numberOfLines={1}>
          {difficultyPickNote(picked, cards)}
        </Txt>
        {onInfo ? (
          <Press onPress={onInfo} accessibilityRole="button" accessibilityLabel={en.a11y.difficultyInfo} hitSlop={slopFor(layout.icon.md)}>
            <Icon name="info" size={layout.icon.md} color={colors.muted} />
          </Press>
        ) : null}
      </View>
      <Grid columns={layout.grid.setupDifficulty} gap={space[2]}>
        {DIFFICULTY_IDS.map((d) => (
          <Tile
            key={d}
            checkbox
            title={en.difficulties[d].name}
            detail={plural(deckSize(bank, d, categories), en.units.cards)}
            colors={colors}
            selected={picked.includes(d)}
            onPress={() => onToggle(d)}
          />
        ))}
      </Grid>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  aside: { flex: 1, textAlign: 'right' },
});
