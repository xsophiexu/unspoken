import { cx, text } from '@/lib/ui';

import styles from './SwitchRow.module.css';

type SwitchRowProps = { title: string; detail?: string; checked: boolean; onChange: (checked: boolean) => void };

// A setting that is on or off: a title and short line at the left, a switch at the right. A native
// checkbox with the switch role sits under the styled track, so keyboard and screen readers get the
// standard behavior.
export function SwitchRow({ title, detail, checked, onChange }: SwitchRowProps) {
  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span className={text('optionTitle')}>{title}</span>
        {detail !== undefined && <span className={cx(styles.detail, text('subline'))}>{detail}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="visually-hidden"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={cx(styles.track, checked && styles.on)} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
