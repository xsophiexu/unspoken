'use client';

import { en } from '@unspoken/content';
import { plural, type Difficulty, type RoundState } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import { useId } from 'react';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { catalogFor, countCards } from '@/lib/catalog';

import { SheetHead } from './SheetHead';
import styles from './sheets.module.css';

type DifficultyPickerProps = {
  round: RoundState;
  onClose: () => void;
  onPick: (difficulty: Difficulty) => void;
};

// Opens from the Card header's level badge: the levels with how many cards each has.
export function DifficultyPicker({ round, onClose, onPick }: DifficultyPickerProps) {
  const id = useId();
  const catalog = catalogFor(round.config);
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={en.difficultyPicker.title} note={en.difficultyPicker.note} />
      <DifficultyGrid
        kind="act"
        label={en.difficultyPicker.title}
        columns={layout.grid.setupDifficulty}
        current={round.settings.difficulties}
        onPick={onPick}
        detail={(difficulty) => plural(countCards(catalog, difficulty, round.settings), en.units.cards)}
      />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          {en.difficultyPicker.keepPlaying}
        </Button>
      </div>
    </Sheet>
  );
}
