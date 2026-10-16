import { cx, text } from '@/lib/ui';

import { Icon, type IconName } from './Icon';
import styles from './Segmented.module.css';

type Option<T extends string> = { value: T; label: string; icon?: IconName };

type SegmentedProps<T extends string> = {
  name: string;
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
};

// A row of mutually exclusive options (Light / Dark), built on native radios.
export function Segmented<T extends string>({ name, label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={styles.group}>
      {options.map((option) => (
        <label key={option.value} className={cx(styles.option, text('button'), option.value === value && styles.on)}>
          <input type="radio" name={name} className="visually-hidden" checked={option.value === value} onChange={() => onChange(option.value)} />
          {option.icon && <Icon name={option.icon} />}
          {option.label}
        </label>
      ))}
    </div>
  );
}
