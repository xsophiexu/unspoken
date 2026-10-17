'use client';

import { en } from '@unspoken/content';
import type { Difficulty, RoundState } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import { useId } from 'react';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { Button } from '@/components/ui/Button';
import { Tile } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import { routes } from '@/lib/routes';

import { SheetHead } from './SheetHead';
import styles from './sheets.module.css';

type ModeSheetProps = {
  round: RoundState;
  onClose: () => void;
  // Picking a level starts a new round at it.
  onPick: (difficulty: Difficulty) => void;
  onRestart: () => void;
  onLeave: () => void;
};

// Opens from the "Mode · Level ▾" header: switch level, restart, or pick another mode.
export function ModeSheet({ round, onClose, onPick, onRestart, onLeave }: ModeSheetProps) {
  const id = useId();
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={en.modes[round.settings.mode].name} note={en.modeSheet.note} />
      <Section label={en.modeSheet.difficulty}>
        <DifficultyGrid
          kind="act"
          label={en.modeSheet.difficulty}
          columns={layout.grid.sheetDifficulty}
          current={round.settings.difficulties}
          onPick={onPick}
        />
      </Section>
      <Grid columns={2} className={styles.pair}>
        <Tile icon="restart" title={en.modeSheet.restart.title} detail={en.modeSheet.restart.detail} onClick={onRestart} />
        <Tile icon="grid" accent title={en.modeSheet.newGame.title} detail={en.modeSheet.newGame.detail} href={routes.modes} onClick={onLeave} />
      </Grid>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          {en.modeSheet.keepPlaying}
        </Button>
      </div>
    </Sheet>
  );
}
