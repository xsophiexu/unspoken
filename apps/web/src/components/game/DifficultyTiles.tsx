'use client';

import { bank, difficultyPickNote, en } from '@unspoken/content';
import { deckSize, plural, type Category, type Difficulty } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { Icon } from '@/components/ui/Icon';
import { Section } from '@/components/ui/Section';

import styles from './DifficultyTiles.module.css';

type Props = {
  picked: readonly Difficulty[];
  categories: readonly Category[];
  onToggle: (difficulty: Difficulty) => void;
  // The i at the right of the label opens About difficulties; left out, there is none.
  onInfo?: () => void;
  className?: string;
};

// DIFFICULTY with "Pick one or more" (or the picks and their cards) at the right, and the
// multi-select tiles with each one's card count. New game and the difficulty sheet both use it.
export function DifficultyTiles({ picked, categories, onToggle, onInfo, className }: Props) {
  const note = difficultyPickNote(picked, deckSize(bank, picked, categories));
  return (
    <Section
      className={className}
      label={en.setup.difficulty}
      aside={
        onInfo ? (
          <span className={styles.difficultyAside}>
            {note}
            <button type="button" className={styles.infoButton} onClick={onInfo} aria-label={en.a11y.difficultyInfo} aria-haspopup="dialog">
              <Icon name="info" />
            </button>
          </span>
        ) : (
          note
        )
      }
    >
      <DifficultyGrid
        kind="pick"
        label={en.setup.difficulty}
        columns={layout.grid.setupDifficulty}
        current={picked}
        onPick={onToggle}
        detail={(level) => plural(deckSize(bank, level, categories), en.units.cards)}
      />
    </Section>
  );
}
