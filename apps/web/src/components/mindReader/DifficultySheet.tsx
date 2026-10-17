'use client';

import { bank, difficultyPickNote, en } from '@unspoken/content';
import { deckSize, plural, toggleDifficulty, type GameSettings } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import { useId, useState } from 'react';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { SheetHead } from '@/components/sheets/SheetHead';
import sheetStyles from '@/components/sheets/sheets.module.css';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';

type Props = {
  settings: GameSettings;
  onClose: () => void;
  // Plays the picked difficulties (Quick play starts a new word with them).
  onApply: (settings: GameSettings) => void;
  // Custom settings: the Custom game setup.
  customHref: string;
  onCustom: () => void;
};

// Quick play's difficulty-only sheet: New game's multi-select difficulty tiles, Custom settings on
// the left and Apply difficulty on the right. Render it while open.
export function DifficultySheet({ settings, onClose, onApply, customHref, onCustom }: Props) {
  const id = useId();
  const q = en.mindReader.quick;
  const [draft, setDraft] = useState(settings);
  const { difficulties, categories } = draft;
  const cards = deckSize(bank, difficulties, categories);
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={q.sheetTitle} />
      <Section label={en.setup.difficulty} aside={difficultyPickNote(difficulties, cards)}>
        <DifficultyGrid
          kind="pick"
          label={en.setup.difficulty}
          columns={layout.grid.setupDifficulty}
          current={difficulties}
          onPick={(next) => setDraft((current) => toggleDifficulty(current, next))}
          detail={(level) => plural(deckSize(bank, level, categories), en.units.cards)}
        />
      </Section>
      <div className={sheetStyles.buttonPair}>
        <Button size="large" variant="secondary" href={customHref} onClick={onCustom}>
          {q.custom}
        </Button>
        <Button
          size="large"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          {q.apply}
        </Button>
      </div>
    </Sheet>
  );
}
