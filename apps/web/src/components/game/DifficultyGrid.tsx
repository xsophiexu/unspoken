import { en } from '@unspoken/content';
import { DIFFICULTY_IDS, type Difficulty } from '@unspoken/core';
import { textStyles } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';

import { Choice, Tile } from '@/components/ui/Choice';
import { FittedText } from '@/components/ui/FittedText';
import { Grid } from '@/components/ui/Grid';

type DifficultyGridProps = {
  columns: number;
  current: Difficulty;
  onPick: (difficulty: Difficulty) => void;
  // pick: a radio group that only selects (setup). act: buttons that start a new round (sheets).
  kind: 'pick' | 'act';
  label: string;
  // A second line under each level, such as its card count.
  detail?: (difficulty: Difficulty) => ReactNode;
};

// The eight levels in a grid. Long names shrink to fit narrow tiles.
export function DifficultyGrid({ columns, current, onPick, kind, label, detail }: DifficultyGridProps) {
  return (
    <Grid columns={columns} role={kind === 'pick' ? 'radiogroup' : 'group'} aria-label={label}>
      {DIFFICULTY_IDS.map((id) => {
        const name = <FittedText text={en.difficulties[id].name} max={textStyles.optionTitle.size} min={textStyles.small.size} />;
        return kind === 'pick' ? (
          <Choice key={id} type="radio" name="difficulty" look="tile" checked={id === current} onChange={() => onPick(id)} detail={detail?.(id)}>
            {name}
          </Choice>
        ) : (
          <Tile key={id} title={name} detail={detail?.(id)} selected={id === current} onClick={() => onPick(id)} label={en.difficulties[id].name} />
        );
      })}
    </Grid>
  );
}
