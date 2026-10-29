'use client';

import { en, mdEn, mdSpecialties } from '@unspoken/content';
import {
  categoriesInBank,
  deepDiveDifficulties,
  deepDiveSettings,
  difficultySpan,
  easiestDifficulty,
  format,
  hardestDifficulty,
  plural,
  singlePick,
  type DeepDivePick,
  type Difficulty,
  type GameSettings,
} from '@unspoken/core';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { InlineSwitch } from '@/components/ui/InlineSwitch';
import { Sheet } from '@/components/ui/Sheet';
import { countCards, type Catalog } from '@/lib/catalog';
import { cx, text } from '@/lib/ui';
import { useCatalog } from '@/state/edition';

import styles from './DeepDiveSheet.module.css';

type Props = {
  // The Deep dive in progress, if any: its pick and Easiest first start the sheet.
  current?: GameSettings;
  onClose: () => void;
  // Starts a Deep dive with these settings.
  onStart: (settings: GameSettings) => void;
};

// What a Deep dive can pick, with every card it has at any difficulty: UnspokenMD's 13 specialties,
// or the categories Unspoken's bank has.
function deepDiveItems(catalog: Catalog): { id: DeepDivePick; name: string; count: number }[] {
  const { bank, config, difficultyIds } = catalog;
  if (config.specialties) return mdSpecialties.map((s) => ({ id: s.id, name: s.name, count: countCards(catalog, difficultyIds, { categories: [], specialties: [s.id] }) }));
  return categoriesInBank(bank, config).map((c) => ({ id: c, name: en.categories[c], count: countCards(catalog, difficultyIds, { categories: [c] }) }));
}

// Deep dive (home-build, screens 3 and 4): one specialty (a category in Unspoken) from a radio list
// with card counts, the Easiest first switch (on to start), and Start deep dive with the count.
export function DeepDiveSheet({ current, onClose, onStart }: Props) {
  const id = useId();
  const catalog = useCatalog();
  const { config } = catalog;
  const copy = config.specialties ? mdEn.deepDive : en.deepDive;
  const items = deepDiveItems(catalog);
  const [pick, setPick] = useState<DeepDivePick | undefined>(() => (current && singlePick(current, config)) ?? items[0]?.id);
  const [easiestFirst, setEasiestFirst] = useState(current?.easiestFirst ?? true);
  const difficulties = deepDiveDifficulties(config);
  const names = Object.fromEntries(config.difficulties.map((d) => [d.id, en.difficulties[d.id].name])) as Record<Difficulty, string>;
  const span = difficultySpan(difficulties, { names, span: en.difficultySpan.long, mixed: en.difficultyMix }, config);
  const range = { easiest: names[easiestDifficulty(difficulties, config)], hardest: names[hardestDifficulty(difficulties, config)] };
  const cards = items.find((item) => item.id === pick)?.count ?? 0;
  const start = () => {
    if (pick === undefined) return;
    onStart(deepDiveSettings(pick, easiestFirst, config));
    onClose();
  };

  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 id={id} className={text('sheetTitle')}>
            {copy.title}
          </h2>
          <p className={cx(styles.muted, text('small'))}>{format(copy.line, { pickOne: copy.pickOne, difficulties: span })}</p>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={en.a11y.closeSheet}>
          <Icon name="close" />
        </button>
      </div>
      <div className={styles.list} role="radiogroup" aria-label={copy.listLabel}>
        {items.map((item) => (
          <label key={item.id} className={cx(styles.row, item.id === pick && styles.on)}>
            <input type="radio" name={`${id}-pick`} className="visually-hidden" checked={item.id === pick} onChange={() => setPick(item.id)} />
            <span className={styles.radio} aria-hidden="true" />
            <span className={cx(styles.name, text(item.id === pick ? 'rule' : 'chipSmall'))}>{item.name}</span>
            <span className={cx(styles.muted, text('small'))}>{item.count.toLocaleString('en')}</span>
          </label>
        ))}
      </div>
      {/* Easiest first and Start stay in view while a long list scrolls under them. */}
      <div className={styles.footer}>
        <div className={styles.card}>
          <div className={styles.headText}>
            <p className={text('optionTitle')}>{copy.easiestFirst.title}</p>
            <p className={cx(styles.muted, text('small'))}>{easiestFirst ? format(copy.easiestFirst.on, range) : copy.easiestFirst.off}</p>
          </div>
          <InlineSwitch label="" name={copy.easiestFirst.title} checked={easiestFirst} onChange={setEasiestFirst} />
        </div>
        <Button size="large" disabled={pick === undefined} onClick={start}>
          {format(copy.start, { cards: plural(cards, en.units.cards) })}
        </Button>
      </div>
    </Sheet>
  );
}
