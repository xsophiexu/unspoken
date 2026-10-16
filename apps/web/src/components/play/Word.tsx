import { en } from '@unspoken/content';
import type { WordSlot } from '@unspoken/design-tokens';

import { FittedText } from '@/components/ui/FittedText';
import { cx, text } from '@/lib/ui';

import styles from './Word.module.css';

// The word to describe, at the largest size that fits its box (the style sets the limits).
export function Word({ slot, word }: { slot: WordSlot; word: string }) {
  return (
    <div className={styles.word} data-spot="word">
      {slot.label && <p className={cx(styles.label, text('label'))}>{en.play.yourWord}</p>}
      <FittedText
        as="h1"
        text={word}
        max={slot.size}
        min={slot.minSize}
        maxLines={slot.maxLines}
        className={cx(styles.text, text('word'), slot.color === 'accentText' && styles.accent)}
      />
    </div>
  );
}
