import { en } from '@unspoken/content';
import { format, sanitizeTimerDigits, secondsToTimerDigits, timerDigitsLabel, timerDigitsToSeconds } from '@unspoken/core';
import { useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

import styles from './TimerInput.module.css';

type TimerInputProps = {
  seconds: number;
  onChange: (seconds: number) => void;
  // Typing or not; setup checks the time once the box loses focus.
  onFocusChange?: (focused: boolean) => void;
  // Outside the accepted range: the outline turns ink.
  invalid?: boolean;
  // No time limit is on: the box greys out but keeps its time for when the switch goes off.
  disabled?: boolean;
  // The accepted range, shown under min : sec.
  range?: string;
};

// The time limit, typed like a microwave: digits fill from the right, so 1, 4, 5 reads 1:45.
// Seconds over 59 roll into minutes when the box loses focus (1:75 reads 2:15).
export function TimerInput({ seconds, onChange, onFocusChange, invalid = false, disabled = false, range }: TimerInputProps) {
  const [digits, setDigits] = useState(() => secondsToTimerDigits(seconds));
  const [focused, setFocused] = useState(false);
  // A new difficulty moves a default time with it; show that new time.
  if (!focused && digits !== secondsToTimerDigits(seconds)) setDigits(secondsToTimerDigits(seconds));
  const label = timerDigitsLabel(digits);
  const focus = (next: boolean) => {
    setFocused(next);
    onFocusChange?.(next);
  };
  return (
    <label className={cx(styles.box, invalid && styles.invalid, disabled && styles.disabled)}>
      <input
        className={cx(styles.input, text('title'))}
        inputMode="numeric"
        autoComplete="off"
        value={label}
        aria-label={format(en.a11y.timer, { clock: label })}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onFocus={() => focus(true)}
        onBlur={() => focus(false)}
        onChange={(event) => {
          const next = sanitizeTimerDigits(event.target.value);
          setDigits(next);
          onChange(timerDigitsToSeconds(next));
        }}
      />
      {disabled ? (
        <span className={cx(styles.side, text('label'))}>{en.setup.noClock}</span>
      ) : (
        <span className={styles.side}>
          <span className={cx(styles.unit, text('label'))} aria-hidden="true">
            {en.setup.timerUnit}
          </span>
          {range !== undefined && <span className={cx(styles.unit, text('small'))}>{range}</span>}
        </span>
      )}
    </label>
  );
}

// Under the box when the typed time is outside the accepted range.
export function TimerNote({ children }: { children: string }) {
  return (
    <p className={cx(styles.note, text('label'))} role="status">
      <Icon name="info" className={styles.noteIcon} />
      {children}
    </p>
  );
}
