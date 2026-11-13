'use client';

import { difficultyApplyLabel, en } from '@unspoken/content';
import { toggleDifficulty, type GameSettings, type RoundState } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import { useId, useState } from 'react';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { Button } from '@/components/ui/Button';
import { Tile } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import { routes } from '@/lib/routes';
import { useCatalog } from '@/state/edition';

import { SheetHead } from './SheetHead';
import styles from './sheets.module.css';

type ModeSheetProps = {
  round: RoundState;
  onClose: () => void;
  // Apply starts a new round with the picked difficulties (one or more).
  onApply: (settings: GameSettings) => void;
  onRestart: () => void;
  onLeave: () => void;
};

// Opens from the "Mode · Level ▾" header: change the difficulties, restart, or pick another mode.
// The difficulty tiles add or remove picks like New game's; Apply appears once they change.
export function ModeSheet({ round, onClose, onApply, onRestart, onLeave }: ModeSheetProps) {
  const id = useId();
  const { config } = useCatalog();
  const [draft, setDraft] = useState(round.settings);
  const changed = draft.difficulties.join() !== round.settings.difficulties.join();
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={en.modes[round.settings.mode].name} note={en.modeSheet.note} />
      <Section label={en.modeSheet.difficulty}>
        <DifficultyGrid
          kind="act"
          label={en.modeSheet.difficulty}
          columns={layout.grid.sheetDifficulty}
          current={draft.difficulties}
          onPick={(difficulty) => setDraft((current) => toggleDifficulty(current, difficulty, config))}
        />
        {changed && (
          <Button size="large" onClick={() => onApply(draft)}>
            {difficultyApplyLabel(draft.difficulties)}
          </Button>
        )}
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
