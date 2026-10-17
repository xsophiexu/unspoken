import { en } from '@unspoken/content';
import { clampRounds, gameConfig } from '@unspoken/core';
import type { RegionColors } from '@unspoken/design-tokens';
import { View } from 'react-native';

import { usePrefs } from '../state/prefs';
import { SectionLabel } from '../ui/Screen';
import { mrStyles, Stepper } from './ui';

// The ROUNDS section on Game settings (step 3 of a Custom Mind Reader game).
export function MindReaderRounds({ colors }: { colors: RegionColors }) {
  const { mindReader, setMindReader } = usePrefs();
  const s = en.mindReader.settings;
  const { min, max } = gameConfig.mindReader.rounds;
  return (
    <View style={mrStyles.section}>
      <SectionLabel label={s.rounds} colors={colors} />
      <Stepper
        label={s.roundsLabel}
        sub={mindReader.lineup.style === 'teams' ? s.roundsTeams : s.roundsIndividual}
        value={mindReader.rounds}
        min={min}
        max={max}
        onChange={(rounds) => setMindReader((m) => ({ ...m, rounds: clampRounds(rounds) }))}
        colors={colors}
        fill="chip"
      />
    </View>
  );
}
