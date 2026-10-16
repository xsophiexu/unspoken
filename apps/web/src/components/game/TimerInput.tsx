import { en } from '@unspoken/content';
import { format, sanitizeTimerDigits, secondsToTimerDigits, timerDigitsLabel, timerDigitsToSeconds } from '@unspoken/core';

import { cx, text } from '@/lib/ui';

import styles from './TimerInput.module.css';

type TimerInputProps = { seconds: number; onChange: (seconds: number) => void };

// The round timer, typed like a microwave: digits fill from the right, so 1, 4, 5 reads 1:45.
export function TimerInput({ seconds, onChange }: TimerInputProps) {
  const label = timerDigitsLabel(secondsToTimerDigits(seconds));
  return (
    <label className={styles.box}>
      <input
        className={cx(styles.input, text('title'))}
        inputMode="numeric"
        autoComplete="off"
        value={label}
        aria-label={format(en.a11y.timer, { clock: label })}
        onChange={(event) => onChange(timerDigitsToSeconds(sanitizeTimerDigits(event.target.value)))}
      />
      <span className={cx(styles.unit, text('label'))} aria-hidden="true">
        {en.setup.timerUnit}
      </span>
    </label>
  );
}
