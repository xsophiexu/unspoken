import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'quiet';
  // Large is the full-width call to action at the bottom of a screen. Compact is a small pill for a
  // sheet's header, with the full touch target around it.
  size?: 'regular' | 'large' | 'compact';
  icon?: IconName;
  // Renders a link to another screen instead of a button.
  href?: string;
  onClick?: () => void;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;

// The one button. Colors come from the region it sits in, so it works on any background.
export function Button({ variant = 'primary', size = 'regular', icon, href, onClick, className, children, ...rest }: ButtonProps) {
  const classes = cx(styles.button, styles[variant], styles[size], text(size === 'large' ? 'buttonStrong' : 'button'), className);
  const content = (
    <>
      {icon && <Icon name={icon} />}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick} {...rest}>
      {content}
    </button>
  );
}

type IconButtonProps = {
  icon: IconName;
  label: string;
  // The visible circle behind the icon; the touch target is always the full minimum size.
  look?: 'none' | 'filled' | 'outlined';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

// An icon-only button (menu, pause, close) with an accessible name.
export function IconButton({ icon, label, look = 'none', className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className={cx(styles.iconButton, className)} {...rest}>
      <span className={cx(styles.circle, styles[look])}>
        <Icon name={icon} />
      </span>
    </button>
  );
}
