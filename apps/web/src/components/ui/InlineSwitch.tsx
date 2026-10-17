import { cx, text } from '@/lib/ui';

import styles from './InlineSwitch.module.css';

type InlineSwitchProps = {
  // The short visible text beside the switch.
  label: string;
  // The descriptive name screen readers hear.
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// A small switch with a short label, for a section's label row (TIME LIMIT … No limit ◯). A native
// checkbox with the switch role sits under the drawn track, so keyboard and screen readers get the
// standard behavior.
export function InlineSwitch({ label, name, checked, onChange }: InlineSwitchProps) {
  return (
    <label className={cx(styles.switch, text('subline'))}>
      <input type="checkbox" role="switch" className="visually-hidden" aria-label={name} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span aria-hidden="true">{label}</span>
      <span className={cx(styles.track, checked && styles.on)} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
