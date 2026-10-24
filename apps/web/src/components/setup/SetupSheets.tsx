'use client';

import { en } from '@unspoken/content';
import { allCategoriesPicked, format, plural, type Category, type Difficulty } from '@unspoken/core';
import { useId } from 'react';

import { SheetHead } from '@/components/sheets/SheetHead';
import sheetStyles from '@/components/sheets/sheets.module.css';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { difficultyIds } from '@/lib/catalog';
import { cx, text } from '@/lib/ui';

import styles from './SetupSheets.module.css';

// The sheets New game opens: Choose categories, the Difficulty info table and the "few cards" check.
// Render one while it is open; unmount it to close.

type CategoriesProps = {
  onClose: () => void;
  // Categories with cards in the bank, in catalog order, and how many cards each has at the picks.
  available: readonly Category[];
  counts: readonly number[];
  allCount: number;
  cards: number;
  picked: readonly Category[];
  onAllCards: () => void;
  onToggle: (category: Category) => void;
};

// Choose categories: the card count on the title line, the double-tap hint, then the chips. All
// cards is exclusive; double-tapping it highlights every category, and again goes back to All cards.
export function CategoriesSheet({ onClose, available, counts, allCount, cards, picked, onAllCards, onToggle }: CategoriesProps) {
  const id = useId();
  const c = en.categoriesSheet;
  const everyCategory = allCategoriesPicked(picked, available);
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
        <p className={cx(styles.muted, text('subline'))}>{everyCategory ? c.hintAll : c.hint}</p>
      </div>
      <div className={styles.chips} role="group" aria-label={c.title}>
        <Choice type="checkbox" name="categories" look="chip" checked={picked.length === 0} onChange={onAllCards} detail={allCount}>
          {en.themes.all}
        </Choice>
        {available.map((category, i) => (
          <Choice
            key={category}
            type="checkbox"
            name="categories"
            look="chip"
            checked={picked.includes(category)}
            onChange={() => onToggle(category)}
            detail={counts[i]}
          >
            {en.categories[category]}
          </Choice>
        ))}
      </div>
      <div className={sheetStyles.actions}>
        <Button onClick={onClose}>{c.done}</Button>
      </div>
    </Sheet>
  );
}

// The Difficulty info sheet: the same category at each difficulty, the current picks highlighted.
export function DifficultyInfoSheet({ onClose, picked }: { onClose: () => void; picked: readonly Difficulty[] }) {
  const id = useId();
  const info = en.difficultyInfo;
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
export function SmallDeckSheet({ cards, onBack, onPlay }: { cards: number; onBack: () => void; onPlay: () => void }) {
  const id = useId();
  const p = en.smallDeck;
  return (
    <Sheet labelledBy={id} onClose={onBack}>
      <SheetHead id={id} title={format(p.title, { cards: plural(cards, en.units.cards) })} />
      <p className={cx(styles.muted, text('subline'))}>{p.body}</p>
      <div className={sheetStyles.buttonPair}>
        <Button variant="secondary" onClick={onPlay}>
          {p.playAnyway}
        </Button>
        <Button onClick={onBack}>{p.back}</Button>
      </div>
    </Sheet>
  );
}
