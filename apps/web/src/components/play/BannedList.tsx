'use client';

import { en } from '@unspoken/content';
import { fitWordSize } from '@unspoken/core';
import { COLOR_IDS, layout, palettes, textStyles, wordMetrics, type BannedSlot } from '@unspoken/design-tokens';
import { useRef, type CSSProperties } from 'react';

import { Icon } from '@/components/ui/Icon';
import { useElementSize } from '@/lib/hooks';
import { cx, referenceContentWidth, text } from '@/lib/ui';

import styles from './BannedList.module.css';

// Ombre's bands run lightest to strongest over the palette's ramp (every palette has the same bands).
const RAMP_BANDS = palettes[COLOR_IDS[0]].light.ramp.length;

// label: the words over the list in place of DON'T SAY (some Halloween looks); the list keeps
// DON'T SAY as its name.
type BannedListProps = { slot: BannedSlot; words: readonly string[]; freshIndex: number | null; label?: string };

// The words the clue giver can't say, in the style's list look. Long lists (Escalate climbs to ten)
// switch to compact sizes, and every word is sized to fit its cell without breaking.
export function BannedList({ slot, words, freshIndex, label = en.play.dontSay }: BannedListProps) {
  const ref = useRef<HTMLUListElement>(null);
  const width = useElementSize(ref, { width: referenceContentWidth, height: 0 }).width;
  const compact = words.length >= layout.banned.compactFrom;
  const base = compact ? Math.min(slot.size, textStyles.chipSmall.size) : slot.size;
  const twoColumns = slot.variant === 'table' || slot.variant === 'tileGrid' || slot.variant === 'columns' || slot.variant === 'dashedColumns';
  const pad = compact ? layout.chip.compactPaddingX : layout.chip.paddingX;
  // The room one word has: its column, less the padding around it.
  const room = (twoColumns ? (width - layout.chip.gap) / 2 : width) - 2 * pad;
  // One size for the whole list, small enough for its longest word.
  const size = Math.min(...words.map((w) => fitWordSize(w, wordMetrics, { width: room, max: base, min: textStyles.small.size, maxLines: 2 })));
  const style = {
    '--item-size': `${size}px`,
    '--item-weight': slot.weight,
    '--row-height': slot.rowHeight ? `${slot.rowHeight}px` : undefined,
    // Two-column lists fill down the first column, then the second.
    '--rows': Math.ceil(words.length / 2),
  } as CSSProperties;

  return (
    <section className={styles.banned} data-spot="banned" aria-label={en.play.dontSay}>
      {slot.label && <h2 className={cx(styles[`label-${slot.labelColor ?? 'muted'}`], text('overline'))}>{label}</h2>}
      <ul
        ref={ref}
        className={cx(styles.list, styles[slot.variant], styles[`fill-${slot.chipFill ?? 'chip'}`], compact && styles.compact, slot.strike && styles.strike)}
        style={style}
      >
        {words.map((word, i) => (
          <li
            key={word}
            className={styles.item}
            style={slot.variant === 'bands' ? bandStyle(i, words.length) : slot.chipRadius ? { borderRadius: `var(--un-radius-${slot.chipRadius})` } : undefined}
          >
            {slot.numbering === 'leading' && <span className={styles.number}>{i + 1}</span>}
            <span className={styles.word}>{word}</span>
            {i === freshIndex && <span className={cx(styles.new, text('badge'))}>{en.play.newTag}</span>}
            {slot.numbering === 'trailing' && <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>}
            {slot.variant === 'bands' && <Icon name="close" className={styles.mark} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function bandStyle(index: number, count: number): CSSProperties {
  const band = count <= 1 ? 1 : Math.round((index * (RAMP_BANDS - 1)) / (count - 1)) + 1;
  return { background: `var(--un-ramp-${band}-bg)`, color: `var(--un-ramp-${band}-ink)` };
}
