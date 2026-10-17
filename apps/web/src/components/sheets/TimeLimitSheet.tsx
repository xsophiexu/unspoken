'use client';

import { en } from '@unspoken/content';
import {
  clampTimeLimit,
  format,
  formatClock,
  gameConfig,
  isTimeLimitInRange,
  plural,
  sanitizeTimerDigits,
  secondsToTimerDigits,
  stepTimeLimit,
  timerDigitsLabel,
  timerDigitsToSeconds,
} from '@unspoken/core';
import { useId, useState, type CSSProperties } from 'react';

import { TimerNote } from '@/components/game/TimerInput';
import { Button, IconButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { cx, text } from '@/lib/ui';

import { SheetHead } from './SheetHead';
import sheets from './sheets.module.css';
import styles from './TimeLimitSheet.module.css';

export type TimeLimit = { roundSeconds: number; noTimeLimit: boolean };

type TimeLimitSheetProps = {
  // The time limit the next turn plays.
  value: TimeLimit;
  // This turn's time left, which a change leaves alone; null when this turn has no clock.
  clock: string | null;
  onClose: () => void;
  onSave: (value: TimeLimit) => void;
};

const { minRoundSeconds: MIN, maxRoundSeconds: MAX, timeLimitStepSeconds: STEP } = gameConfig;
const LIMITS = { min: formatClock(MIN), max: formatClock(MAX) };

// The big time limit changer on the Paused screen: − and + beside the big time (15 seconds a step),
// the time itself typed like setup's box (digits fill from the right; 1:75 settles as 2:15 once the
// box loses focus), a slider from 0:30 to 10:00, and a No time limit switch. A time outside the
// range shows setup's calm note and Save waits until it is fixed.
export function TimeLimitSheet({ value, clock, onClose, onSave }: TimeLimitSheetProps) {
  const id = useId();
  const s = en.timeLimit;
  const [seconds, setSeconds] = useState(value.roundSeconds);
  const [off, setOff] = useState(value.noTimeLimit);
  const [digits, setDigits] = useState(() => secondsToTimerDigits(value.roundSeconds));
  const [focused, setFocused] = useState(false);
  // Once typing stops, a typed 1:75 reads 2:15.
  if (!focused && digits !== secondsToTimerDigits(seconds)) setDigits(secondsToTimerDigits(seconds));

  const inRange = isTimeLimitInRange(seconds);
  const outOfRange = !off && !focused && !inRange;
  const label = timerDigitsLabel(digits);
  const step = plural(STEP, en.units.seconds);
  const setTime = (next: number) => {
    setSeconds(next);
    setDigits(secondsToTimerDigits(next));
  };

  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead
        id={id}
        title={s.title}
        note={clock ? format(s.keepsClock, { clock }) : s.startsNextTurn}
        end={<IconButton icon="close" label={en.a11y.closeMenu} look="filled" onClick={onClose} />}
      />

      <div className={styles.readout}>
        <IconButton icon="minus" label={format(en.a11y.shorter, { step })} look="filled" className={styles.stepper} disabled={off || seconds <= MIN} onClick={() => setTime(stepTimeLimit(seconds, -1))} />
        <label className={cx(styles.time, outOfRange && styles.invalid, off && styles.off)}>
          {off ? (
            <span className={text('headline')}>{s.noLimit}</span>
          ) : (
            <input
              className={cx(styles.input, text('score'))}
              inputMode="numeric"
              autoComplete="off"
              value={label}
              aria-label={format(en.a11y.timer, { clock: label })}
              aria-invalid={outOfRange || undefined}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(event) => {
                const next = sanitizeTimerDigits(event.target.value);
                setDigits(next);
                setSeconds(timerDigitsToSeconds(next));
              }}
            />
          )}
        </label>
        <IconButton icon="plus" label={format(en.a11y.longer, { step })} look="filled" className={styles.stepper} disabled={off || seconds >= MAX} onClick={() => setTime(stepTimeLimit(seconds, 1))} />
      </div>
      {!off && <p className={cx(styles.unit, text('small'))}>{en.setup.timerUnit}</p>}

      <div className={styles.slider}>
        <input
          type="range"
          className={styles.range}
          min={MIN}
          max={MAX}
          step={STEP}
          value={clampTimeLimit(seconds)}
          disabled={off}
          aria-label={en.a11y.timeLimitSlider}
          aria-valuetext={formatClock(clampTimeLimit(seconds))}
          style={{ '--fill': `${((clampTimeLimit(seconds) - MIN) / (MAX - MIN)) * 100}%` } as CSSProperties}
          onChange={(event) => setTime(Number(event.target.value))}
        />
        <span className={cx(styles.ends, text('small'))} aria-hidden="true">
          <span>{LIMITS.min}</span>
          <span>{LIMITS.max}</span>
        </span>
      </div>
      {outOfRange && <TimerNote>{format(en.setup.timerOutOfRange, LIMITS)}</TimerNote>}

      <label className={styles.switchRow}>
        <span className={styles.switchText}>
          <span className={text('optionTitle')}>{s.noTimeLimit.title}</span>
          <span className={cx(styles.detail, text('small'))}>{s.noTimeLimit.detail}</span>
        </span>
        <input type="checkbox" role="switch" className="visually-hidden" checked={off} onChange={(event) => setOff(event.target.checked)} />
        <span className={cx(styles.track, off && styles.on)} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </label>

      <div className={sheets.actions}>
        <Button size="large" disabled={!off && !inRange} onClick={() => onSave({ noTimeLimit: off, roundSeconds: inRange ? seconds : value.roundSeconds })}>
          {s.save}
        </Button>
      </div>
    </Sheet>
  );
}

// The Paused screen's row that opens the changer: a timer icon, Change time limit (with "Starts next
// turn" under it once changed), the next turn's time and a chevron.
export function ChangeTimeLimitRow({ value, pending, onClick }: { value: string; pending: boolean; onClick: () => void }) {
  const p = en.paused;
  return (
    <button type="button" className={styles.row} aria-label={format(en.a11y.changeTimeLimit, { value })} onClick={onClick}>
      <Icon name="timer" className={styles.rowIcon} />
      <span className={styles.rowText}>
        <span className={text('optionTitle')}>{p.changeTimeLimit}</span>
        {pending && <span className={cx(styles.detail, text('small'))}>{p.startsNextTurn}</span>}
      </span>
      <span className={cx(styles.value, text('optionTitle'))}>{value}</span>
      <Icon name="chevronRight" className={styles.rowIcon} />
    </button>
  );
}
