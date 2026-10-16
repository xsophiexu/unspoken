import { en } from '@unspoken/content';
import type { ControlsSlot, StyleRegions } from '@unspoken/design-tokens';
import type { CSSProperties } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

import styles from './Controls.module.css';

type ControlsProps = {
  slot: ControlsSlot;
  regions: StyleRegions;
  canSkip: boolean;
  canCorrect: boolean;
  onSkip?: () => void;
  onCorrect?: () => void;
  // Shows the "swipe the card" hint (Deck) until the first answer.
  showHint: boolean;
};

// Skip and Correct: swipe links over growing bars, pills, two buttons or a full-width split bar.
// Swiping does the same; these keep both answers a tap (or a key) away.
export function Controls({ slot, regions, canSkip, canCorrect, onSkip, onCorrect, showHint }: ControlsProps) {
  const tab = onSkip ? undefined : -1;
  const sizing = {
    '--control-height': `${slot.height}px`,
    '--control-radius': `var(--un-radius-${slot.radius})`,
    '--skip-grow': slot.ratio?.[0] ?? 1,
    '--correct-grow': slot.ratio?.[1] ?? 1,
    '--skip-width': slot.skipWidth ? `${slot.skipWidth}px` : undefined,
  } as CSSProperties;
  const skip = { onClick: onSkip, disabled: !canSkip, tabIndex: tab, 'aria-label': en.play.skip };
  const correct = { onClick: onCorrect, disabled: !canCorrect, tabIndex: tab, 'aria-label': en.play.correct };

  switch (slot.variant) {
    case 'swipeLinks':
      return (
        <div className={cx(styles.links, slot.hint === 'bars' && styles.withBars)} style={sizing}>
          <button type="button" className={cx(styles.link, styles.skipLink, text('button'))} {...skip}>
            {en.play.skipLink}
          </button>
          {slot.hint === 'text' && (
            <span className={cx(styles.hint, text('small'), !showHint && styles.hidden)} aria-hidden="true">
              {en.play.swipeTheCard}
            </span>
          )}
          <button type="button" className={cx(styles.link, styles.correctLink, text('button'))} {...correct}>
            {en.play.correctLink}
          </button>
        </div>
      );
    case 'splitBar':
      return (
        <div className={styles.splitBar} style={sizing}>
          <button type="button" className={cx(styles.half, styles.skipHalf, text('button'))} data-region={regions.skip ?? 'surface'} {...skip}>
            {en.play.skip}
          </button>
          <button type="button" className={cx(styles.half, styles.correctHalf, text('buttonStrong'))} data-region={regions.correct ?? 'panel'} {...correct}>
            {en.play.correct}
          </button>
        </div>
      );
    case 'pills':
    case 'buttons':
      return (
        <div className={cx(styles.row, styles[slot.variant], slot.skipWidth ? styles.fixedSkip : slot.ratio && styles.ratio)} style={sizing}>
          <button type="button" className={cx(styles.skip, styles[`skip-${slot.skip}`], text(slot.skip === 'round' ? 'label' : 'button'))} {...skip}>
            {slot.skip === 'roundIcon' ? (
              <>
                <span className={styles.roundIcon}>
                  <Icon name="arrowRight" />
                </span>
                <span className={text('small')}>{en.play.skip}</span>
              </>
            ) : (
              en.play.skip
            )}
          </button>
          <button type="button" className={cx(styles.correct, text(slot.correctIcon ? 'buttonStrong' : 'button'))} {...correct}>
            {slot.correctIcon && <Icon name="check" />}
            {en.play.correct}
          </button>
        </div>
      );
  }
}
