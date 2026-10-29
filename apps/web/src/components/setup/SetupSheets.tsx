'use client';

import { en } from '@unspoken/content';
import { allCategoriesPicked, format, plural, type Difficulty } from '@unspoken/core';
import { useId } from 'react';

import { SheetHead } from '@/components/sheets/SheetHead';
import sheetStyles from '@/components/sheets/sheets.module.css';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { useCatalog } from '@/state/edition';
import { cx, text } from '@/lib/ui';

import styles from './SetupSheets.module.css';

// The sheets New game opens: Choose categories (or specialties), the Difficulty info table and the
// "few cards" check.
// Render one while it is open; unmount it to close.

// One chip in a picks sheet: a category or specialty, its name and how many cards it has.
export type PickItem<T extends string> = { id: T; name: string; count: number };

type PickChipsProps<T extends string> = {
  label: string;
  // The All chip (All cards, All specialties) and its count; it is on when nothing is picked.
  all: { label: string; count: number };
  items: readonly PickItem<T>[];
  picked: readonly T[];
  onAll: () => void;
  onToggle: (id: T) => void;
};

// The multi-select chips with their counts, All first. Choose categories, Choose specialties and
// the in-game Specialties tab all use them.
export function PickChips<T extends string>({ label, all, items, picked, onAll, onToggle }: PickChipsProps<T>) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      <Choice type="checkbox" name={label} look="chip" checked={picked.length === 0} onChange={onAll} detail={all.count}>
        {all.label}
      </Choice>
      {items.map((item) => (
        <Choice key={item.id} type="checkbox" name={label} look="chip" checked={picked.includes(item.id)} onChange={() => onToggle(item.id)} detail={item.count}>
          {item.name}
        </Choice>
      ))}
    </div>
  );
}

type PicksSheetProps<T extends string> = Omit<PickChipsProps<T>, 'label'> & {
  onClose: () => void;
  copy: { title: string; hint: string; hintAll: string; done: string };
  // Cards the picks draw from, on the title line.
  cards: number;
};

// Choose categories (Choose specialties in UnspokenMD): the card count on the title line, the
// double-tap hint, then the chips. All is exclusive; double-tapping it highlights every chip, and
// again goes back to All.
export function PicksSheet<T extends string>({ onClose, copy: c, cards, ...chips }: PicksSheetProps<T>) {
  const id = useId();
  const everyItem = allCategoriesPicked(
    chips.picked,
    chips.items.map((item) => item.id),
  );
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <div className={styles.roomyHead}>
        <div className={styles.titleLine}>
          <h2 id={id} className={text('sheetTitle')}>
            {c.title}
          </h2>
          <span className={cx(styles.muted, text('subline'))} role="status">
            {plural(cards, en.units.cards)}
          </span>
        </div>
        <p className={cx(styles.muted, text('subline'))}>{everyItem ? c.hintAll : c.hint}</p>
      </div>
      <PickChips label={c.title} {...chips} />
      <div className={sheetStyles.actions}>
        <Button onClick={onClose}>{c.done}</Button>
      </div>
    </Sheet>
  );
}

// The Difficulty info sheet's copy: its title and line, and the example words at each difficulty.
export type DifficultyInfoCopy = { title: string; body: string; examples: readonly { category: string; words: Readonly<Record<Difficulty, string>> }[] };

// The Difficulty info sheet: the same category at each difficulty, the current picks highlighted.
// `info` is the edition's copy and examples (en.difficultyInfo, or mdEn.difficultyInfo).
export function DifficultyInfoSheet({ onClose, picked, info }: { onClose: () => void; picked: readonly Difficulty[]; info: DifficultyInfoCopy }) {
  const id = useId();
  const { difficultyIds } = useCatalog();
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead
        id={id}
        title={info.title}
        end={
          <button type="button" className={styles.close} onClick={onClose} aria-label={en.a11y.closeSheet}>
            <Icon name="close" />
          </button>
        }
      />
      <p className={cx(styles.muted, text('subline'))}>{info.body}</p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">{info.title}</span>
            </th>
            {info.examples.map((e) => (
              <th key={e.category} scope="col" className={cx(styles.muted, text('overline'))}>
                {e.category}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {difficultyIds.map((d) => {
            const selected = picked.includes(d);
            return (
              <tr key={d} className={cx(selected && styles.picked)} aria-current={selected || undefined}>
                <th scope="row">
                  <span className={cx(styles.level, text('pill'))}>{en.difficulties[d].name}</span>
                </th>
                {info.examples.map((e) => (
                  <td key={e.category} className={text('subline')}>
                    {e.words[d]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Sheet>
  );
}

// Start game with few cards to draw from: play anyway, or go back and add categories or difficulties.
export function SmallDeckSheet({ cards, body, onBack, onPlay }: { cards: number; body: string; onBack: () => void; onPlay: () => void }) {
  const id = useId();
  const p = en.smallDeck;
  return (
    <Sheet labelledBy={id} onClose={onBack}>
      <SheetHead id={id} title={format(p.title, { cards: plural(cards, en.units.cards) })} />
      <p className={cx(styles.muted, text('subline'))}>{body}</p>
      <div className={sheetStyles.buttonPair}>
        <Button variant="secondary" onClick={onPlay}>
          {p.playAnyway}
        </Button>
        <Button onClick={onBack}>{p.back}</Button>
      </div>
    </Sheet>
  );
}
