'use client';

import { difficultyApplyLabel, en } from '@unspoken/content';
import { toggleDifficulty, type GameSettings } from '@unspoken/core';
import { useId, useState } from 'react';

import { DifficultyTiles } from '@/components/game/DifficultyTiles';
import { SheetHead } from '@/components/sheets/SheetHead';
import sheetStyles from '@/components/sheets/sheets.module.css';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { config } from '@/lib/catalog';
import { cx } from '@/lib/ui';

import styles from './mindReader.module.css';

type Props = {
  settings: GameSettings;
  onClose: () => void;
  // Plays the picked difficulties (Quick Play starts a new word with them).
  onApply: (settings: GameSettings) => void;
  // Custom settings: the Custom game setup. Left out (Versus's Game settings), the sheet has one
  // button that keeps the picks.
  customHref?: string;
  onCustom?: () => void;
  // The i beside "Pick one or more", with the picks so far (Versus's Game settings).
  onInfo?: (settings: GameSettings) => void;
};

// The difficulty-only sheet: New game's multi-select difficulty tiles. Quick Play has Custom
// settings on the left and Apply difficulty on the right; Versus's Game settings has Done. Render
// it while open.
export function DifficultySheet({ settings, onClose, onApply, customHref, onCustom, onInfo }: Props) {
  const id = useId();
  const q = en.mindReader.quick;
  const [draft, setDraft] = useState(settings);
  const { difficulties, categories } = draft;
  const apply = () => {
    onApply(draft);
    onClose();
  };
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={q.sheetTitle} />
      <DifficultyTiles
        className={styles.tiles}
        picked={difficulties}
        categories={categories}
        onToggle={(next) => setDraft((current) => toggleDifficulty(current, next, config))}
        onInfo={onInfo ? () => onInfo(draft) : undefined}
      />
      {customHref ? (
        <div className={cx(sheetStyles.buttonPair, styles.footer)}>
          <Button size="large" variant="secondary" href={customHref} onClick={onCustom}>
            {q.custom}
          </Button>
          <Button size="large" onClick={apply}>
            {difficultyApplyLabel(difficulties)}
          </Button>
        </div>
      ) : (
        <div className={styles.footer}>
          <Button size="large" onClick={apply}>
            {en.versus.settings.difficultyDone}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
