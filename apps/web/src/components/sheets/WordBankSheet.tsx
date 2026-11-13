'use client';

import { en, mdEn, mdSpecialties } from '@unspoken/content';
import { categoriesInBank, plural, tapAllCards, toggleDifficulty, toggleSpecialty, type AllCardsTap, type Category, type GameSettings, type Specialty } from '@unspoken/core';
import { motion } from '@unspoken/design-tokens';
import { useId, useRef, useState } from 'react';

import { DifficultyTiles } from '@/components/game/DifficultyTiles';
import { PickChips } from '@/components/setup/SetupSheets';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Section } from '@/components/ui/Section';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { catalogs, countCards } from '@/lib/catalog';
import { toggleCategory } from '@/lib/settings';
import { cx, text } from '@/lib/ui';
import { useCatalog } from '@/state/edition';

import sheetStyles from './sheets.module.css';
import styles from './mdSheets.module.css';

type Tab = 'difficulty' | 'picks';

type Props = {
  // The game's settings; the sheet edits a copy until Apply.
  settings: GameSettings;
  onClose: () => void;
  // Starts a new game with the picks.
  onApply: (settings: GameSettings) => void;
  // New game, for everything else (the timer, skips, the score).
  customHref: string;
  onCustom: () => void;
};

const p = mdEn.picksSheet;
const specialtyIds = mdSpecialties.map((s) => s.id);
const themes = categoriesInBank(catalogs.unspoken.bank, catalogs.unspoken.config);

// The word bank sheet (quick-play-2, option B), from the header chip: Difficulty and Specialties
// tabs in UnspokenMD, Difficulty and Categories in Unspoken, then Custom settings and Apply, like
// Mind Reader's Quick Play difficulty sheet.
export function WordBankSheet({ settings, onClose, onApply, customHref, onCustom }: Props) {
  const id = useId();
  const catalog = useCatalog();
  const { config } = catalog;
  const [tab, setTab] = useState<Tab>('difficulty');
  const [draft, setDraft] = useState(settings);
  const md = Boolean(config.specialties);
  const allTap = useRef<AllCardsTap<Specialty>>(null);
  const allCategoriesTap = useRef<AllCardsTap<Category>>(null);
  const specialties = draft.specialties ?? [];
  const { categories } = draft;
  const specialtyCards = (picks: readonly Specialty[]) => countCards(catalog, catalog.difficultyIds, { categories: [], specialties: picks });
  const categoryCards = (picks: readonly Category[]) => countCards(catalog, catalog.difficultyIds, { categories: picks });
  const setSpecialties = (next: readonly Specialty[]) => setDraft((current) => ({ ...current, specialties: next }));
  const setCategories = (next: readonly Category[]) => setDraft((current) => ({ ...current, categories: [...next] }));
  const onAll = () => {
    const tap = tapAllCards(specialties, allTap.current, Date.now(), specialtyIds, motion.doubleTapMs);
    allTap.current = tap.last;
    setSpecialties(tap.categories);
  };
  const onAllCategories = () => {
    const tap = tapAllCards(categories, allCategoriesTap.current, Date.now(), themes, motion.doubleTapMs);
    allCategoriesTap.current = tap.last;
    setCategories(tap.categories);
  };
  const picksLabel = md ? p.specialties : p.categories;
  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <h2 id={id} className="visually-hidden">
        {p.tabs}
      </h2>
      <div className={styles.tabsRow}>
        <div className={styles.grow}>
          <Segmented<Tab>
            name="word-bank"
            label={p.tabs}
            value={tab}
            options={[
              { value: 'difficulty', label: p.difficulty },
              { value: 'picks', label: picksLabel },
            ]}
            onChange={setTab}
          />
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={en.a11y.closeSheet}>
          <Icon name="close" />
        </button>
      </div>
      <p className={cx(styles.muted, text('small'))}>{p.note}</p>
      {tab === 'difficulty' ? (
        <DifficultyTiles picked={draft.difficulties} picks={draft} onToggle={(next) => setDraft((current) => toggleDifficulty(current, next, config))} />
      ) : md ? (
        <Section label={p.specialtiesLabel} aside={plural(specialtyCards(specialties), en.units.cards)}>
          <PickChips<Specialty>
            label={p.specialties}
            all={{ label: mdEn.specialtyPicks.all, count: specialtyCards([]) }}
            items={mdSpecialties.map((s) => ({ id: s.id, name: s.name, count: specialtyCards([s.id]) }))}
            picked={specialties}
            onAll={onAll}
            onToggle={(next) => setSpecialties(toggleSpecialty(specialties, next, config))}
          />
        </Section>
      ) : (
        <Section label={p.categoriesLabel} aside={plural(categoryCards(categories), en.units.cards)}>
          <PickChips<Category>
            label={p.categories}
            all={{ label: en.themes.all, count: categoryCards([]) }}
            items={themes.map((theme) => ({ id: theme, name: en.categories[theme], count: categoryCards([theme]) }))}
            picked={categories}
            onAll={onAllCategories}
            onToggle={(next) => setCategories(toggleCategory(categories, next))}
          />
        </Section>
      )}
      <div className={cx(sheetStyles.buttonPair, styles.footer)}>
        <Button size="large" variant="secondary" href={customHref} onClick={onCustom}>
          {p.custom}
        </Button>
        <Button size="large" onClick={apply}>
          {p.apply}
        </Button>
      </div>
    </Sheet>
  );
}
