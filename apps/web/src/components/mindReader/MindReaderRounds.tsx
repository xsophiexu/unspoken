'use client';

import { en } from '@unspoken/content';
import { clampRounds, gameConfig } from '@unspoken/core';

import { Section } from '@/components/ui/Section';
import { useGame } from '@/state/game';

import { Stepper } from './parts';

// The ROUNDS section on Game settings (step 3 of a Custom Mind Reader game).
export function MindReaderRounds() {
  const { mindReader, setMindReader } = useGame();
  const s = en.mindReader.settings;
  const { min, max } = gameConfig.mindReader.rounds;
  return (
    <Section label={s.rounds}>
      <Stepper
        label={s.roundsLabel}
        sub={mindReader.lineup.style === 'teams' ? s.roundsTeams : s.roundsIndividual}
        value={mindReader.rounds}
        min={min}
        max={max}
        fill="chip"
        onChange={(rounds) => setMindReader((m) => ({ ...m, rounds: clampRounds(rounds) }))}
      />
    </Section>
  );
}
