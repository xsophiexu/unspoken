import { en } from '@unspoken/content';
import { layout, radius, space, textStyles, type BannedSlot, type RampBand, type RegionColors, type TextStyleName } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { fittedSize, useWidth } from '../../ui/fit';
import { Icon } from '../../ui/Icon';
import { Txt } from '../../ui/Txt';
import { Target } from '../spotlight';

type Props = {
  slot: BannedSlot;
  colors: RegionColors;
  words: readonly string[];
  // Escalate marks the word its last correct answer added.
  freshIndex: number | null;
  // Ombre's bands, lightest to strongest.
  ramp: readonly RampBand[];
  // The side margin, which variants that run edge to edge bleed out by.
  bleed: number;
  // Short windows (small phones) use the compact sizes for any list.
  short: boolean;
};

// Bands run edge to edge down into the footer, so the list sits at the bottom of its area.
export const pinsToFooter = (slot: BannedSlot) => slot.variant === 'bands';

// The banned words in any of the style catalog's list variants. Lists of
// layout.banned.compactFrom words or more (Escalate's ten), and every list on a short window, switch
// to compact sizes, and every word shrinks to fit its cell.
export function Banned({ slot, colors, words, freshIndex, ramp, bleed, short }: Props) {
  const [width, onLayout] = useWidth();
  const compact = short || words.length >= layout.banned.compactFrom;
  const max = compact ? Math.min(slot.size, textStyles.chipSmall.size) : slot.size;
  const variant: TextStyleName = slot.weight === 600 ? 'label' : 'chip';
  const word = (text: string, room: number, color: string, extra?: object) => (
    <Txt variant={variant} size={fittedSize(text, room, { variant, max, min: textStyles.small.size, maxLines: 2 })} color={color} style={extra}>
      {text}
    </Txt>
  );
  const fresh = (i: number) =>
    i === freshIndex ? (
      <Txt variant="overline" color={colors.accentText}>
        {en.play.newTag}
      </Txt>
    ) : null;
  const half = (width - space[4]) / 2;
  // Chips and tiles in the region's chip color or its accent tint; the text stays chipInk.
  const chipFill = colors[slot.chipFill ?? 'chip'];

  let list: ReactNode;
  switch (slot.variant) {
    case 'chips': {
      const padX = compact ? layout.chip.compactPaddingX : layout.chip.paddingX;
      const padY = compact ? layout.chip.compactPaddingY : layout.chip.paddingY;
      const ring = layout.stroke.focus;
      list = (
        <View style={styles.wrap}>
          {words.map((w, i) => (
            <View
              key={w}
              style={[
                styles.chip,
                { backgroundColor: chipFill, borderRadius: radius[slot.chipRadius ?? 'sm'], paddingHorizontal: padX, paddingVertical: padY },
                i === freshIndex && { borderWidth: ring, borderColor: colors.accentText, paddingHorizontal: padX - ring, paddingVertical: padY - ring },
              ]}
            >
              {word(w, width - 2 * padX, colors.chipInk)}
              {fresh(i)}
            </View>
          ))}
        </View>
      );
      break;
    }
    case 'table':
    case 'tileGrid': {
      const tiles = slot.variant === 'tileGrid';
      const pad = tiles ? space[4] : space[3.5];
      const rows = pairs(words);
      const cellPad = { paddingHorizontal: pad, paddingVertical: tiles ? 0 : compact ? space[2] : space[3] };
      list = (
        <View
          style={
            tiles
              ? styles.tileRows
              : [styles.table, { borderColor: colors.rule, borderWidth: layout.stroke.hairline, borderRadius: radius.md, backgroundColor: colors.bg }]
          }
        >
          {rows.map((row, r) => (
            <View key={r} style={[styles.pair, tiles ? styles.tileGap : r > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: colors.rule }]}>
              {row.map(({ text, index }, c) => (
                <View
                  key={text}
                  style={[
                    styles.cell,
                    cellPad,
                    tiles && { backgroundColor: chipFill, borderRadius: radius[slot.chipRadius ?? 'md'], minHeight: compact ? layout.banned.compactRow : slot.rowHeight },
                    !tiles && c === 0 && { borderRightWidth: layout.stroke.hairline, borderRightColor: colors.rule },
                  ]}
                >
                  {word(text, half - 2 * pad, tiles ? colors.chipInk : colors.ink)}
                  {fresh(index)}
                </View>
              ))}
              {row.length === 1 ? <View style={[styles.cell, cellPad]} /> : null}
            </View>
          ))}
        </View>
      );
      break;
    }
    case 'rows':
    case 'numberedRows': {
      const numbered = slot.variant === 'numberedRows';
      const trailing = slot.numbering === 'trailing';
      const numberRoom = numbered ? space[6] : 0;
      list = (
        <View>
          {words.map((w, i) => (
            <View key={w} style={[styles.rowItem, { borderBottomColor: colors.rule, paddingVertical: compact ? space[1.5] : space[3] }]}>
              {numbered && !trailing ? (
                <Txt variant="label" color={colors.muted} style={styles.number}>
                  {i + 1}
                </Txt>
              ) : null}
              <View style={styles.rowWord}>
                {word(w, width - numberRoom, colors.ink, slot.strike ? { textDecorationLine: 'line-through', textDecorationColor: colors.accentText } : undefined)}
                {fresh(i)}
              </View>
              {numbered && trailing ? (
                <Txt variant="overline" color={colors.muted}>
                  {String(i + 1).padStart(2, '0')}
                </Txt>
              ) : null}
            </View>
          ))}
        </View>
      );
      break;
    }
    case 'columns':
    case 'dashedColumns': {
      const dashed = slot.variant === 'dashedColumns';
      const split = Math.ceil(words.length / 2);
      const room = half - (dashed ? space[3] + space[3] : 0);
      const column = (start: number, end: number) => (
        <View style={[styles.column, { rowGap: compact ? space[3] : space[5.5] }]}>
          {words.slice(start, end).map((w, k) => (
            <View key={w} style={styles.columnItem}>
              {dashed ? <View style={[styles.dash, { backgroundColor: colors.muted }]} /> : null}
              {word(w, room, colors.ink)}
              {fresh(start + k)}
            </View>
          ))}
        </View>
      );
      list = (
        <View style={styles.columns}>
          {column(0, split)}
          {column(split, words.length)}
        </View>
      );
      break;
    }
    case 'bands': {
      const height = compact ? layout.banned.compactRow : slot.rowHeight;
      list = (
        <View style={{ marginHorizontal: -bleed }}>
          {words.map((w, i) => {
            const band = ramp[words.length > 1 ? Math.round((i * (ramp.length - 1)) / (words.length - 1)) : 0] ?? { bg: colors.chip, ink: colors.chipInk };
            return (
              <View key={w} style={[styles.band, { backgroundColor: band.bg, minHeight: height, paddingHorizontal: bleed }]}>
                {word(w, width - 2 * space[6], band.ink, styles.grow)}
                {fresh(i)}
                <Icon name="cross" size={layout.icon.sm} color={band.ink} />
              </View>
            );
          })}
        </View>
      );
      break;
    }
  }

  return (
    <Target name="banned">
      <View onLayout={onLayout} style={[styles.block, compact && styles.compactBlock]} accessibilityLabel={`${en.play.dontSay}: ${words.join(', ')}`}>
        {slot.label ? (
          <Txt variant="overline" color={colors[slot.labelColor ?? 'muted']}>
            {en.play.dontSay}
          </Txt>
        ) : null}
        {list}
      </View>
    </Target>
  );
}

// Words two to a row, keeping each word's place in the list.
function pairs(words: readonly string[]) {
  const rows: { text: string; index: number }[][] = [];
  words.forEach((text, index) => {
    if (index % 2 === 0) rows.push([]);
    rows[rows.length - 1]?.push({ text, index });
  });
  return rows;
}

const styles = StyleSheet.create({
  block: { gap: space[3] },
  compactBlock: { gap: space[2] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.chip.gap },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space[1.5], maxWidth: '100%' },
  table: { overflow: 'hidden' },
  tileRows: { gap: layout.chip.gap },
  pair: { flexDirection: 'row' },
  tileGap: { gap: layout.chip.gap },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[1.5] },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: space[3.5], borderBottomWidth: layout.stroke.hairline },
  number: { width: space[3.5] },
  rowWord: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap' },
  columns: { flexDirection: 'row', gap: space[4] },
  column: { flex: 1 },
  columnItem: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  dash: { width: space[3], height: layout.stroke.focus },
  band: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  grow: { flex: 1 },
});
