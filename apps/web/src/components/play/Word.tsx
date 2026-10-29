import { en } from '@unspoken/content';
import type { WordSlot } from '@unspoken/design-tokens';

import { FittedText } from '@/components/ui/FittedText';
import { cx, text } from '@/lib/ui';

import styles from './Word.module.css';

// The word to describe, at the largest size that fits its box (the style sets the limits).
// label: the line over the word in place of "Your word" (UnspokenMD's "From search · Tough · Respiratory").
export function Word({ slot, word, label = en.play.yourWord }: { slot: WordSlot; word: string; label?: string }) {
  return (
    <div className={styles.word} data-spot="word">
      {slot.label && <p className={cx(styles.label, text('label'))}>{label}</p>}
      <FittedText
        as="h1"
        text={word}
        max={slot.size}
        min={slot.minSize}
        maxLines={slot.maxLines}
        className={cx(styles[`color-${slot.color}`], text('word'))}
      />
    </div>
  );
}
