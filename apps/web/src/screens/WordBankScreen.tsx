'use client';

import { en, mdEn } from '@unspoken/content';
import { format, plural, searchCards, type BankEntry, type Difficulty } from '@unspoken/core';
import { useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useCatalog } from '@/state/edition';

import listStyles from '@/components/sheets/mdSheets.module.css';
import styles from './WordBankScreen.module.css';

const copy = en.wordBank;

// Where a card is filed: its specialty in UnspokenMD, its categories in Unspoken.
function filedUnder(card: BankEntry): string {
  if (card.specialty) return mdEn.specialties[card.specialty];
  return card.categories.map((c) => en.categories[c]).join(', ');
}

// Every card in the edition to read through, easiest difficulty first and A to Z within each, with
// a search. Read only: nothing here changes the game, and the link at the top goes back to it.
export function WordBankScreen() {
  const { bank, difficultyIds, edition, config } = useCatalog();
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const groups = useMemo(() => {
    const ids = searching ? new Set(searchCards(bank, query, config).map((r) => r.id)) : undefined;
    const shown = ids ? bank.filter((card) => ids.has(card.id)) : bank;
    const byDifficulty = new Map<Difficulty, BankEntry[]>(difficultyIds.map((d) => [d, []]));
    for (const card of shown) byDifficulty.get(card.difficulty)?.push(card);
    return difficultyIds
      .map((difficulty) => ({ difficulty, cards: (byDifficulty.get(difficulty) ?? []).sort((a, b) => a.word.localeCompare(b.word)) }))
      .filter((group) => group.cards.length > 0);
  }, [bank, query, searching, config, difficultyIds]);
  const total = groups.reduce((sum, group) => sum + group.cards.length, 0);

  return (
    <Screen tone="base" width="column" back={{ href: routes.play, label: copy.back }} title={copy.title} sub={format(copy.sub[edition], { cards: plural(bank.length, en.units.cards) })}>
      <label className={listStyles.searchBox}>
        <Icon name="search" className={listStyles.searchIcon} />
        <input
          type="search"
          className={cx(listStyles.searchInput, text('optionTitle'))}
          aria-label={copy.label}
          placeholder={copy.placeholder}
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {searching && (
          <span className={cx(listStyles.muted, text('small'))} role="status">
            {plural(total, en.units.cards)}
          </span>
        )}
      </label>
      {searching && total === 0 && <p className={cx(listStyles.muted, text('small'))}>{copy.none}</p>}
      {groups.map(({ difficulty, cards }) => (
        <section key={difficulty} className={styles.group} aria-label={en.difficulties[difficulty].name}>
          <h2 className={cx(styles.heading, text('label'))}>{format(copy.group, { difficulty: en.difficulties[difficulty].name, cards: plural(cards.length, en.units.cards) })}</h2>
          <ul className={listStyles.results}>
            {cards.map((card) => (
              <li key={card.id} className={styles.row}>
                <span className={cx(listStyles.term, text('optionTitle'))}>{card.word}</span>
                <span className={cx(listStyles.muted, text('small'))}>{filedUnder(card)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Screen>
  );
}
