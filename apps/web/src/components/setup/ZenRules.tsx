'use client';

import { en, mdEn } from '@unspoken/content';
import { format, formatClock, isTimeLimitInRange, stepWithin, type GameConfig, type GameSettings } from '@unspoken/core';
import type { ReactNode } from 'react';

import { TimerInput, TimerNote } from '@/components/game/TimerInput';
import { Stepper } from '@/components/mindReader/parts';
import { InlineSwitch } from '@/components/ui/InlineSwitch';
import { Section } from '@/components/ui/Section';
import { cx, text } from '@/lib/ui';

import styles from './ZenRules.module.css';

type ZenRulesProps = {
  settings: GameSettings;
  config: GameConfig;
  update: (change: Partial<GameSettings>) => void;
  // Typing a time: setup checks it once the box loses focus.
  timerFocused: boolean;
  onTimerFocus: (focused: boolean) => void;
};

// Zen's OPTIONAL RULES (quick-play, screens 1 and 2): the timer, the skip limit and Play to a score,
// each a card with a switch. Off, the card says what you get; on, it says what the rule does and
// opens its control (the time box, or a − n + row).
export function ZenRules({ settings, config, update, timerFocused, onTimerFocus }: ZenRulesProps) {
  const r = mdEn.zenRules;
  const zen = config.zen;
  if (!zen) return null;
  const timerOn = !settings.noTimeLimit;
  const skipsOn = settings.noSkipLimit === false;
  const scoreOn = settings.noScoreTarget === false;
  const skips = settings.skips ?? zen.skips.default;
  const target = settings.scoreTarget ?? zen.scoreTarget.default;
  const limits = { min: formatClock(config.minRoundSeconds), max: formatClock(config.maxRoundSeconds) };
  const outOfRange = timerOn && !isTimeLimitInRange(settings.roundSeconds, config) && !timerFocused;

  return (
    <Section label={mdEn.setup.optionalRules}>
      <RuleCard title={r.timer.title} sub={timerOn ? r.timer.on : r.timer.off} on={timerOn} onChange={(on) => update({ noTimeLimit: !on })}>
        <TimerInput
          seconds={settings.roundSeconds}
          invalid={outOfRange}
          range={format(en.setup.timerRange, limits)}
          fill="chip"
          onFocusChange={onTimerFocus}
          onChange={(seconds) => update({ roundSeconds: seconds })}
        />
        {outOfRange && <TimerNote>{format(en.setup.timerOutOfRange, limits)}</TimerNote>}
      </RuleCard>
      <RuleCard
        title={r.skipLimit.title}
        sub={skipsOn ? r.skipLimit.on : r.skipLimit.off}
        on={skipsOn}
        onChange={(on) => update({ noSkipLimit: !on, skips: stepWithin(skips, 0, zen.skips) })}
      >
        <Stepper label={r.skipLimit.stepper} value={skips} min={zen.skips.min} max={zen.skips.max} fill="chip" onChange={(n) => update({ skips: stepWithin(n, 0, zen.skips) })} />
      </RuleCard>
      <RuleCard
        title={r.scoreTarget.title}
        sub={scoreOn ? r.scoreTarget.on : r.scoreTarget.off}
        on={scoreOn}
        onChange={(on) => update({ noScoreTarget: !on, scoreTarget: target })}
      >
        <Stepper
          label={r.scoreTarget.stepper}
          value={target}
          min={zen.scoreTarget.min}
          max={zen.scoreTarget.max}
          fill="chip"
          onChange={(n) => update({ scoreTarget: stepWithin(n, 0, zen.scoreTarget) })}
        />
      </RuleCard>
    </Section>
  );
}

// A white card: the rule's title and line with a switch at the right, and its control while on.
function RuleCard({ title, sub, on, onChange, children }: { title: string; sub: string; on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.text}>
          <p className={text('optionTitle')}>{title}</p>
          <p className={cx(styles.muted, text('small'))}>{sub}</p>
        </div>
        <InlineSwitch label="" name={title} checked={on} onChange={onChange} />
      </div>
      {on && children}
    </div>
  );
}
