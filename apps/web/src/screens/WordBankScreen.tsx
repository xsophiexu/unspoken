'use client';

import { en, mdEn, mdSpecialties } from '@unspoken/content';
import { categoriesInBank, format, plural, searchCards, type BankEntry, type Difficulty } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { catalogs } from '@/lib/catalog';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useCatalog } from '@/state/edition';

import styles from './WordBankScreen.module.css';

const copy = en.wordBank;
const themes = categoriesInBank(catalogs.unspoken.bank, catalogs.unspoken.config);

// Where a card is filed: its specialty in UnspokenMD, its categories in Unspoken.
function filedUnder(card: BankEntry): string {
  if (card.specialty) return mdEn.specialties[card.specialty];
  return card.categories.map((c) => en.categories[c]).join(', ');
}

// Every card in the edition with its banned words, to read through (like the card finder): a
// compact sticky bar with the search, a specialty or category filter and difficulty chips, then
// the cards, easiest first and A to Z. Read only; "← Back to game" returns to the game.
export function WordBankScreen() {
  const { bank, difficultyIds, edition, config } = useCatalog();
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState('');
  const [difficulties, setDifficulties] = useState<readonly Difficulty[]>([]);
  const [limit, setLimit] = useState<number>(layout.wordBank.page);
  const picks = edition === 'md' ? mdSpecialties.map((s) => ({ id: s.id as string, name: s.name })) : themes.map((t) => ({ id: t as string, name: en.categories[t] }));
  const banned = (card: BankEntry) => card.banned.slice(0, config.difficulties.find((d) => d.id === card.difficulty)?.bannedCount ?? card.banned.length);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byWord = q ? new Set(searchCards(bank, q, config).map((r) => r.id)) : undefined;
    const order = (d: Difficulty) => difficultyIds.indexOf(d);
    return bank
      .filter((card) => difficulties.length === 0 || difficulties.includes(card.difficulty))
      .filter((card) => !pick || card.specialty === pick || (card.categories as readonly string[]).includes(pick))
      .filter((card) => !byWord || byWord.has(card.id) || banned(card).some((b) => b.toLowerCase().includes(q)))
      .sort((a, b) => order(a.difficulty) - order(b.difficulty) || a.word.localeCompare(b.word));
    // banned depends only on config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, config, query, pick, difficulties, difficultyIds]);
  const shown = cards.slice(0, limit);
  const filtered = query.trim() !== '' || pick !== '' || difficulties.length > 0;
  const toggle = (d: Difficulty) => {
    setDifficulties((current) => (current.includes(d) ? current.filter((x) => x !== d) : difficultyIds.filter((x) => x === d || current.includes(x))));
    setLimit(layout.wordBank.page);
  };
  const clear = () => {
    setQuery('');
    setPick('');
    setDifficulties([]);
    setLimit(layout.wordBank.page);
  };

  return (
    <main className={styles.page} data-region="base">
      <div className={styles.column}>
        <div className={styles.bar}>
          <div className={styles.top}>
            <Link href={routes.play} className={cx(styles.back, text('link'))}>
              {copy.back}
            </Link>
            <h1 className={cx(styles.title, text('optionTitle'))}>{copy.title}</h1>
          </div>
          <div className={styles.search}>
            <label className={styles.searchBox}>
              <Icon name="search" className={styles.muted} />
              <input
                type="search"
                className={cx(styles.searchInput, text('input'))}
                aria-label={copy.label}
                placeholder={copy.placeholder}
                autoComplete="off"
                enterKeyHint="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setLimit(layout.wordBank.page);
                }}
              />
            </label>
            <select
              className={cx(styles.select, text('small'))}
              aria-label={copy.pickLabel[edition]}
              value={pick}
              onChange={(event) => {
                setPick(event.target.value);
                setLimit(layout.wordBank.page);
              }}
            >
              <option value="">{copy.all[edition]}</option>
              {picks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.chips} role="group" aria-label={copy.difficulty}>
            {difficultyIds.map((d) => (
              <button key={d} type="button" className={cx(styles.chip, text('small'))} aria-pressed={difficulties.includes(d)} onClick={() => toggle(d)}>
                {en.difficulties[d].name}
              </button>
            ))}
          </div>
          <div className={cx(styles.meta, text('small'))}>
            <span role="status">{format(copy.count, { shown: cards.length.toLocaleString('en-US'), total: plural(bank.length, en.units.cards) })}</span>
            {filtered && (
              <button type="button" className={cx(styles.clear, text('small'))} onClick={clear}>
                {copy.clear}
              </button>
            )}
          </div>
        </div>
        {cards.length === 0 && <p className={cx(styles.muted, styles.empty, text('small'))}>{copy.none}</p>}
        <ul className={styles.list} aria-label={copy.title}>
          {shown.map((card) => (
            <li key={card.id} className={styles.card}>
              <div className={styles.head}>
                <span className={cx(styles.word, text('optionTitle'))}>{card.word}</span>
                <span className={cx(styles.tags, text('small'))}>
                  <span className={cx(styles.level, text('pill'))}>{en.difficulties[card.difficulty].name}</span>
                  <span className={styles.muted}>{filedUnder(card)}</span>
                </span>
              </div>
              <ul className={styles.banned} aria-label={en.play.dontSay}>
                {banned(card).map((b) => (
                  <li key={b} className={text('small')}>
                    {b}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {cards.length > shown.length && (
          <button type="button" className={cx(styles.more, text('link'))} onClick={() => setLimit((n) => n + layout.wordBank.page)}>
            {copy.more}
          </button>
        )}
      </div>
    </main>
  );
}
