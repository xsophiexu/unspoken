import { en } from '@unspoken/content';
import { DIFFICULTY_IDS, allCategoriesPicked, format, plural, type Category, type Difficulty } from '@unspoken/core';
import { layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonPair } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { Txt } from '../ui/Txt';

// The sheets New game opens: Choose categories, the Difficulty info table and the "few cards" check.

type CategoriesProps = {
  visible: boolean;
  onClose: () => void;
  // Categories with cards in the bank, in catalog order, and how many cards each has at the picks.
  available: readonly Category[];
  counts: readonly number[];
  // Cards in All cards and in the current choice.
  allCount: number;
  cards: number;
  picked: readonly Category[];
  onAllCards: () => void;
  onToggle: (category: Category) => void;
};

// Choose categories: the card count on the title line, the double-tap hint, then the chips. All
// cards is exclusive; double-tapping it highlights every category, and again goes back to All cards.
export function CategoriesSheet({ visible, onClose, available, counts, allCount, cards, picked, onAllCards, onToggle }: CategoriesProps) {
  const c = en.categoriesSheet;
  const everyCategory = allCategoriesPicked(picked, available);
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <View style={styles.roomyHeader}>
            <SheetHeader title={c.title} note={plural(cards, en.units.cards)} sub={everyCategory ? c.hintAll : c.hint} colors={colors} />
          </View>
          <View style={styles.chips}>
            <Chip label={en.themes.all} count={allCount} colors={colors} selected={picked.length === 0} onPress={onAllCards} />
            {available.map((category, i) => (
              <Chip
                key={category}
                role="checkbox"
                label={en.categories[category]}
                count={counts[i]}
                colors={colors}
                selected={picked.includes(category)}
                onPress={() => onToggle(category)}
              />
            ))}
          </View>
          <Button kind="primary" label={c.done} colors={colors} onPress={onClose} style={styles.gapAbove} />
        </>
      )}
    </Sheet>
  );
}

// The Difficulty info sheet: the same category at each difficulty, the current picks highlighted.
export function DifficultyInfoSheet({ visible, onClose, picked }: { visible: boolean; onClose: () => void; picked: readonly Difficulty[] }) {
  const info = en.difficultyInfo;
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <>
          <SheetHeader title={info.title} sub={info.body} colors={colors} onClose={onClose} />
          <View style={styles.table} accessibilityRole="list">
            <View style={styles.row}>
              <View style={styles.levelCell} />
              {info.examples.map((e) => (
                <Txt key={e.category} variant="overline" color={colors.muted} style={styles.cell}>
                  {e.category}
                </Txt>
              ))}
            </View>
            {DIFFICULTY_IDS.map((d) => (
              <InfoRow key={d} difficulty={d} selected={picked.includes(d)} colors={colors} />
            ))}
          </View>
        </>
      )}
    </Sheet>
  );
}

function InfoRow({ difficulty, selected, colors }: { difficulty: Difficulty; selected: boolean; colors: RegionColors }) {
  const name = en.difficulties[difficulty].name;
  const words = en.difficultyInfo.examples.map((e) => e.words[difficulty]);
  return (
    <View
      style={[styles.row, styles.bodyRow, { borderTopColor: colors.rule }, selected && { backgroundColor: colors.chip }]}
      accessibilityLabel={[name, ...words].join(', ')}
      accessibilityState={{ selected }}
    >
      <View style={styles.levelCell}>
        <View style={[styles.levelPill, { backgroundColor: selected ? colors.accent : colors.chip }]}>
          <Txt variant="pill" color={selected ? colors.onAccent : colors.chipInk} numberOfLines={1}>
            {name}
          </Txt>
        </View>
      </View>
      {words.map((word, i) => (
        <Txt key={i} variant="subline" color={colors.ink} style={styles.cell}>
          {word}
        </Txt>
      ))}
    </View>
  );
}

// Start game with few cards to draw from: play anyway, or go back and add categories or difficulties.
export function SmallDeckSheet({ visible, cards, onBack, onPlay }: { visible: boolean; cards: number; onBack: () => void; onPlay: () => void }) {
  const p = en.smallDeck;
  return (
    <Sheet visible={visible} onClose={onBack}>
      {(colors) => (
        <>
          <SheetHeader title={format(p.title, { cards: plural(cards, en.units.cards) })} sub={p.body} colors={colors} />
          <ButtonPair secondary={{ label: p.playAnyway, colors, onPress: onPlay }} primary={{ label: p.back, colors, onPress: onBack }} style={styles.gapAbove} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // Room above the Choose categories title, and more below the header before the chips start.
  roomyHeader: { paddingTop: layout.sheet.headerRoom, paddingBottom: layout.sheet.headerGap },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  gapAbove: { marginTop: space[4] },
  table: { marginTop: space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingHorizontal: space[1.5], paddingVertical: space[2] },
  bodyRow: { borderTopWidth: layout.stroke.hairline, borderRadius: radius.sm },
  levelCell: { width: layout.control.levelTile + space[3] },
  levelPill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space[2], paddingVertical: space[0.5] },
  cell: { flex: 1 },
});
