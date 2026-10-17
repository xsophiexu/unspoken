'use client';

import { en } from '@unspoken/content';
import { format } from '@unspoken/core';
import { teamColors } from '@unspoken/design-tokens';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { SheetHead } from '@/components/sheets/SheetHead';
import { cx, text } from '@/lib/ui';

import styles from './mindReader.module.css';

// The pieces Mind Reader's setup and turns are built from. Colors come from the region each one
// sits in; team colors from the --un-team-N variables (design tokens).

const TEAM_COLOR_COUNT = teamColors.light.length;

// The CSS color for a team's color index, wrapping past the end.
export function teamColorVar(index: number): string {
  return `var(--un-team-${((index % TEAM_COLOR_COUNT) + TEAM_COLOR_COUNT) % TEAM_COLOR_COUNT})`;
}

export function TeamDot({ color, small = false }: { color: number; small?: boolean }) {
  return <span className={cx(styles.dot, small && styles.dotSmall)} style={{ background: teamColorVar(color) }} aria-hidden="true" />;
}

// The colored letter badge before a team's name on setup.
export function TeamBadge({ name, color }: { name: string; color: number }) {
  return (
    <span className={cx(styles.badge, text('pill'))} style={{ background: teamColorVar(color) }} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

// Back link and step count, the title, and a bar for each step with the steps done filled in.
export function StepTop({ step, total, title, back }: { step: number; total: number; title: string; back: { href: string; label: string } }) {
  return (
    <div className={styles.stepTop}>
      <div className={styles.topRow}>
        <Link href={back.href} className={cx(styles.link, text('link'))}>
          {back.label}
        </Link>
        <span className={cx(styles.muted, text('subline'))}>{format(en.mindReader.step, { n: step, total })}</span>
      </div>
      <h1 className={text('title')}>{title}</h1>
      <div className={styles.bars} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cx(styles.bar, i < step && styles.barDone)} />
        ))}
      </div>
    </div>
  );
}

// − value + on a row: Number of players, Number of teams, Rounds, Correct predictions.
export function Stepper({
  label,
  sub,
  value,
  onChange,
  min,
  max,
  fill,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  // The row's background; the buttons take the other fill.
  fill: 'raised' | 'chip';
}) {
  return (
    <div className={cx(styles.stepper, fill === 'raised' ? styles.onRaised : styles.onChip)}>
      <div className={styles.grow}>
        <p className={text('optionTitle')}>{label}</p>
        {sub && <p className={cx(styles.muted, text('small'))}>{sub}</p>}
      </div>
      <button type="button" className={cx(styles.stepButton, text('optionTitle'))} disabled={value <= min} aria-label={format(en.a11y.fewer, { label })} onClick={() => onChange(value - 1)}>
        −
      </button>
      <output className={cx(styles.stepValue, text('sheetTitle'))} aria-live="polite">
        {value}
      </output>
      <button type="button" className={cx(styles.stepButton, text('optionTitle'))} disabled={value >= max} aria-label={format(en.a11y.more, { label })} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

// A calm note: muted ink on a soft grey row with a small icon. Never red.
export function Note({ children, icon = 'info' }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className={cx(styles.note, text('subline'))} role="status">
      <Icon name={icon} className={styles.noteIcon} />
      <span className={styles.grow}>{children}</span>
    </p>
  );
}

// A grey name pill, a button when it opens something.
export function NamePill({ name, onClick, selected, label }: { name: string; onClick?: (target: HTMLElement) => void; selected?: boolean; label?: string }) {
  const className = cx(styles.pill, selected && styles.pillSelected, text('topicChip'));
  return onClick ? (
    <button type="button" className={className} onClick={(event) => onClick(event.currentTarget)} aria-label={label ?? name} aria-expanded={selected}>
      <span className={styles.ellipsis}>{name}</span>
    </button>
  ) : (
    <span className={className}>
      <span className={styles.ellipsis}>{name}</span>
    </span>
  );
}

// An outlined pill that adds something ("+ Add player", "+ Maya").
export function AddPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={cx(styles.pill, styles.addPill, text('label'))} onClick={onClick}>
      {label}
    </button>
  );
}

// A one-line text field that commits on Enter (a new player's name).
export function NameField({ placeholder, onSubmit, autoFocus = false }: { placeholder: string; onSubmit: (name: string) => void; autoFocus?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <form
      className={styles.field}
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
        setValue('');
      }}
    >
      <input
        className={cx(styles.input, text('input'))}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="done"
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  );
}

// Two options side by side, the chosen one filled in the accent (Individual / Teams, Owls got it /
// Not guessed). Native radios, so keyboard and screen readers get the standard behavior.
export function SegmentSwitch<T extends string>({ name, label, options, value, onChange }: { name: string; label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className={styles.segments}>
      {options.map((o) => (
        <label key={o.value} className={cx(styles.segment, text('label'), o.value === value && styles.segmentOn)}>
          <input type="radio" name={name} className="visually-hidden" checked={o.value === value} onChange={() => onChange(o.value)} />
          <span className={styles.ellipsis}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

// A white card on the page.
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx(styles.card, className)} data-region="raised" style={style}>
      {children}
    </div>
  );
}

// A section label with a note at the right.
export function LabelRow({ label, aside, as: Tag = 'h2' }: { label: string; aside?: string | null; as?: 'h2' | 'p' }) {
  return (
    <div className={styles.labelRow}>
      <Tag className={cx(styles.muted, text('overline'))}>{label}</Tag>
      {aside && <span className={cx(styles.muted, styles.aside, text('subline'))}>{aside}</span>}
    </div>
  );
}

// A centered pop-up over a scrim with a title, a line and two buttons, on the native modal dialog.
export function Dialog({ title, body, primary, secondary, onClose }: { title: string; body: string; primary: { label: string; onClick: () => void }; secondary: { label: string; onClick: () => void }; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={id}
      data-region="base"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={styles.dialogPanel}>
        <h2 id={id} className={text('sheetTitle')}>
          {title}
        </h2>
        <p className={cx(styles.muted, text('hint'))}>{body}</p>
        <Button size="large" onClick={primary.onClick}>
          {primary.label}
        </Button>
        <Button size="large" variant="secondary" onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      </div>
    </dialog>
  );
}

// A sheet to type a new name; Save keeps it.
export function RenameSheet({ title, initial, onSave, onClose }: { title: string; initial: string; onSave: (name: string) => void; onClose: () => void }) {
  const id = useId();
  const [value, setValue] = useState(initial);
  const save = () => {
    if (!value.trim()) return;
    onSave(value);
    onClose();
  };
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={title} />
      <form
        className={styles.sheetBody}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          className={cx(styles.input, text('input'))}
          data-region="raised"
          value={value}
          aria-label={title}
          autoComplete="off"
          autoFocus
          onChange={(event) => setValue(event.target.value)}
        />
        <Button size="large" type="submit" disabled={!value.trim()}>
          {en.mindReader.lineup.save}
        </Button>
      </form>
    </Sheet>
  );
}

export type MenuItem = { label: string; onClick: () => void; danger?: boolean; submenu?: boolean };
export type MoveTarget = { label: string; dot: number; onClick: () => void };

// The menu on a player, placed under the row or chip it opened from: Rename, Move to › (opens the
// team list in its place, headed MOVE TO) and Remove from game. A pale popover in light mode, a dark
// one in dark mode (--un-popover-*). On the native modal dialog, so Escape and a tap outside close it.
export function PlayerMenu({ anchor, items, moveTo, onClose }: { anchor: DOMRect; items: readonly MenuItem[]; moveTo: readonly MoveTarget[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);
  // Right-aligned under the anchor, kept inside the window by the stylesheet's max().
  const style = { '--anchor-right': `${anchor.right}px`, '--anchor-bottom': `${anchor.bottom}px` } as CSSProperties;
  const run = (fn: () => void) => {
    fn();
    onClose();
  };
  return (
    <dialog
      ref={ref}
      className={styles.menu}
      style={style}
      aria-label={en.a11y.menu}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {moving ? (
        <>
          <p className={cx(styles.menuHead, text('overline'))}>{en.mindReader.lineup.menu.moveHeader}</p>
          {moveTo.map((t) => (
            <button key={t.label} type="button" className={cx(styles.menuRow, text('label'))} onClick={() => run(t.onClick)}>
              <TeamDot color={t.dot} small />
              <span className={styles.grow}>{t.label}</span>
            </button>
          ))}
        </>
      ) : (
        items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cx(styles.menuRow, item.danger && styles.menuDanger, text('label'))}
            onClick={() => (item.submenu ? setMoving(true) : run(item.onClick))}
          >
            <span className={styles.grow}>{item.label}</span>
            {item.submenu && <Icon name="chevronRight" className={styles.menuChevron} />}
          </button>
        ))
      )}
    </dialog>
  );
}
