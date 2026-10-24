import { en } from '@unspoken/content';
import type { Difficulty } from '@unspoken/core';
import { textStyles } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';

import { Choice, Tile } from '@/components/ui/Choice';
import { FittedText } from '@/components/ui/FittedText';
import { Grid } from '@/components/ui/Grid';
import { difficultyIds } from '@/lib/catalog';

type DifficultyGridProps = {
  columns: number;
  // The picks, each shown selected.
  current: readonly Difficulty[];
  onPick: (difficulty: Difficulty) => void;
  // pick: checkboxes that add or remove a pick (New game). act: buttons that start a new round at
  // one difficulty (sheets).
  kind: 'pick' | 'act';
  label: string;
  // A second line under each level, such as its card count.
  detail?: (difficulty: Difficulty) => ReactNode;
};

// The levels in a grid (Easy, then Normal to Legend). Long names shrink to fit narrow tiles.
export function DifficultyGrid({ columns, current, onPick, kind, label, detail }: DifficultyGridProps) {
  return (
    <Grid columns={columns} role="group" aria-label={label}>
      {difficultyIds.map((id) => {
        const name = <FittedText text={en.difficulties[id].name} max={textStyles.optionTitle.size} min={textStyles.small.size} />;
        return kind === 'pick' ? (
          <Choice key={id} type="checkbox" name="difficulty" look="tile" mark checked={current.includes(id)} onChange={() => onPick(id)} detail={detail?.(id)}>
            {name}
          </Choice>
        ) : (
          <Tile key={id} title={name} detail={detail?.(id)} selected={current.includes(id)} onClick={() => onPick(id)} label={en.difficulties[id].name} />
        );
      })}
    </Grid>
  );
}
