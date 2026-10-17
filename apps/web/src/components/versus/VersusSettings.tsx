'use client';

import { bonusNote, en } from '@unspoken/content';
import { clampVersusSetup, format, gameConfig, offersGuesserBonus, plural, type VersusSetup } from '@unspoken/core';

import { Stepper } from '@/components/mindReader/parts';
import { InlineSwitch } from '@/components/ui/InlineSwitch';
import { Section } from '@/components/ui/Section';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import styles from './versus.module.css';

// Versus's Game settings under the time limit: Rounds and Skips per turn, then Scoring with the
// bonus for who guesses it (Individual with 3+, on by default), the banned word penalty (off by
// default) and, when it is on, how many points it costs.
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
        {/* Individual with 3 or more players: whoever got the card can score a bonus. */}
        {offersGuesserBonus(versus.lineup) && <SwitchRow label={s.bonus} sub={bonusNote(versus.bonus)} on={versus.bonus} onChange={(on) => set({ bonus: on })} />}
        <SwitchRow label={s.penalty} sub={versus.penalty ? plural(versus.penaltyPoints, s.penaltyOn) : s.penaltyOff} on={versus.penalty} onChange={(on) => set({ penalty: on })} />
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

// A title and line with a switch at the right, in a Stepper row's box.
function SwitchRow({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className={styles.switchRow}>
      <div className={styles.grow}>
        <p className={text('optionTitle')}>{label}</p>
        <p className={cx(styles.muted, text('small'))}>{sub}</p>
      </div>
      <InlineSwitch label="" name={label} checked={on} onChange={onChange} />
    </div>
  );
}
