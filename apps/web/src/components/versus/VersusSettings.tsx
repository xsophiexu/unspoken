'use client';

import { en } from '@unspoken/content';
import { clampVersusSetup, format, gameConfig, plural, type VersusSetup } from '@unspoken/core';

import { Stepper } from '@/components/mindReader/parts';
import { InlineSwitch } from '@/components/ui/InlineSwitch';
import { Section } from '@/components/ui/Section';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import styles from './versus.module.css';

// Versus's Game settings under the time limit: Rounds and Skips per turn, then Scoring with the
// banned word penalty (off by default) and, when it is on, how many points it costs.
export function VersusSettings() {
  const { versus, setVersus } = useGame();
  const s = en.versus.settings;
  const { rounds, skips, penalty } = gameConfig.versus;
  const set = (patch: Partial<VersusSetup>) => setVersus((v) => clampVersusSetup({ ...v, ...patch }));
  const teams = versus.lineup.style === 'teams';
  return (
    <>
      <Section label={s.rounds}>
        <Stepper label={s.roundsLabel} sub={teams ? s.roundsTeams : s.roundsIndividual} value={versus.rounds} min={rounds.min} max={rounds.max} fill="chip" onChange={(n) => set({ rounds: n })} />
        <Stepper label={s.skipsLabel} sub={s.skipsSub} value={versus.skips} min={skips.min} max={skips.max} fill="chip" onChange={(n) => set({ skips: n })} />
      </Section>
      <Section label={s.scoring}>
        <div className={styles.switchRow}>
          <div className={styles.grow}>
            <p className={text('optionTitle')}>{s.penalty}</p>
            <p className={cx(styles.muted, text('small'))}>{versus.penalty ? plural(versus.penaltyPoints, s.penaltyOn) : s.penaltyOff}</p>
          </div>
          <InlineSwitch label="" name={s.penalty} checked={versus.penalty} onChange={(on) => set({ penalty: on })} />
        </div>
        {versus.penalty && (
          <Stepper
            label={s.pointsLost}
            sub={teams ? s.pointsLostTeams : s.pointsLostIndividual}
            value={versus.penaltyPoints}
            display={format(s.pointsLostValue, { n: versus.penaltyPoints })}
            min={penalty.points.min}
            max={penalty.points.max}
            fill="chip"
            onChange={(n) => set({ penaltyPoints: n })}
          />
        )}
      </Section>
    </>
  );
}
