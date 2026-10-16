import Link from 'next/link';
import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

import styles from './Choice.module.css';

type Look = 'tile' | 'chip' | 'topic';

type ChoiceProps = {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  look: Look;
  children: ReactNode;
  // Small second line (card counts, mode descriptions).
  detail?: ReactNode;
};

// A selectable tile or chip: a native radio or checkbox under a styled label, so keyboard and
// screen readers get the standard behavior.
export function Choice({ type, name, checked, onChange, look, children, detail }: ChoiceProps) {
  return (
    <label className={cx(styles.choice, styles[look], checked && styles.on)}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="visually-hidden" />
      <span className={cx(styles.title, text(look === 'tile' ? 'optionTitle' : look === 'topic' ? 'topicChip' : 'button'))}>{children}</span>
      {detail !== undefined && <span className={cx(styles.detail, text(look === 'tile' ? 'small' : 'label'))}>{detail}</span>}
    </label>
  );
}

type TileProps = {
  title: ReactNode;
  detail?: ReactNode;
  icon?: IconName;
  // The current choice, shown filled.
  selected?: boolean;
  // Filled like the current choice without being one (the main action of a pair).
  accent?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  label?: string;
};

// A tile that acts (starts a round, opens a screen) and looks like a Choice tile.
export function Tile({ title, detail, icon, selected = false, accent = false, disabled = false, href, onClick, label }: TileProps) {
  const className = cx(styles.choice, styles.tile, styles.action, (selected || accent) && styles.on, disabled && styles.off);
  const content = (
    <>
      {icon && <Icon name={icon} className={styles.icon} />}
      <span className={cx(styles.title, text('optionTitle'))}>{title}</span>
      {detail !== undefined && <span className={cx(styles.detail, text('small'))}>{detail}</span>}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={className} onClick={onClick} aria-label={label} aria-current={selected || undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={selected}>
      {content}
    </button>
  );
}
