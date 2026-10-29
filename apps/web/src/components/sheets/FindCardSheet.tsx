'use client';

import { en, mdEn } from '@unspoken/content';
import { format, plural, searchCards, type CardSearchResult } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import { useId, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { cx, text } from '@/lib/ui';
import { useCatalog } from '@/state/edition';

import styles from './mdSheets.module.css';

const s = mdEn.search;

function detail(result: CardSearchResult): { difficulty: string; specialty: string } {
  return { difficulty: en.difficulties[result.difficulty].name, specialty: result.specialty ? mdEn.specialties[result.specialty] : '' };
}

// Find a card (quick-play-2, screen 5): type part of a term to search every UnspokenMD card,
// whatever difficulty the game plays. Each result shows the term, with the typed part marked, and
// its difficulty and specialty; tapping one plays it next.
export function FindCardSheet({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const id = useId();
  const { bank, config } = useCatalog();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCards(bank, query, config), [bank, query, config]);
  const shown = results.slice(0, layout.search.maxResults);

  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <div className={styles.searchHead}>
        <div className={styles.grow}>
          <h2 id={id} className={text('sheetTitle')}>
            {s.title}
          </h2>
          <p className={cx(styles.muted, text('small'))}>{s.note}</p>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={en.a11y.closeSheet}>
          <Icon name="close" />
        </button>
      </div>
      <label className={styles.searchBox}>
        <Icon name="search" className={styles.searchIcon} />
        <input
          type="search"
          className={cx(styles.searchInput, text('optionTitle'))}
          aria-label={s.label}
          placeholder={s.placeholder}
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query.trim() && (
          <span className={cx(styles.muted, text('small'))} role="status">
            {plural(results.length, en.units.cards)}
          </span>
        )}
      </label>
      {query.trim() && shown.length === 0 && <p className={cx(styles.muted, text('small'))}>{s.none}</p>}
      {shown.length > 0 && (
        <ul className={styles.results}>
          {shown.map((result) => (
            <li key={result.id}>
              <button type="button" className={styles.result} aria-label={format(s.resultLabel, { word: result.word, ...detail(result) })} onClick={() => onPick(result.id)}>
                <span className={styles.grow}>
                  <span className={cx(styles.term, text('optionTitle'))}>
                    <Marked word={result.word} match={result.match} />
                  </span>
                  <span className={cx(styles.muted, text('small'))}>{format(s.detail, detail(result))}</span>
                </span>
                <Icon name="chevronRight" className={styles.muted} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length > shown.length && <p className={cx(styles.muted, text('small'))}>{format(s.more, { shown: shown.length })}</p>}
    </Sheet>
  );
}

// The term with the typed part highlighted.
function Marked({ word, match }: { word: string; match: CardSearchResult['match'] }) {
  const end = match.start + match.length;
  return (
    <>
      {word.slice(0, match.start)}
      <mark className={styles.mark}>{word.slice(match.start, end)}</mark>
      {word.slice(end)}
    </>
  );
}
