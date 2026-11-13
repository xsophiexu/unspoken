import { en } from '@unspoken/content';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { catalogs } from '@/lib/catalog';
import { EDITION_STORAGE_KEY } from '@/lib/edition';
import { WordBankScreen } from '@/screens/WordBankScreen';

import { renderApp, saved } from './app';

const mdBank = catalogs.md.bank;
// The cards list's own rows (a plain DOM read: role queries over thousands of rows are slow).
const cards = () => Array.from(document.querySelector(`ul[aria-label="${en.wordBank.title}"]`)?.children ?? []) as HTMLElement[];
const status = () => screen.getByRole('status');

function inMd() {
  saved({ [EDITION_STORAGE_KEY]: { edition: 'md' } });
  renderApp(<WordBankScreen />);
}

describe('Word bank', () => {
  it('shows each card with its difficulty, specialty and banned words, read only, with a link back to the game', () => {
    inMd();
    expect(screen.getByRole('link', { name: en.wordBank.back })).toHaveAttribute('href', '/play/');
    expect(status()).toHaveTextContent(`${mdBank.length.toLocaleString('en-US')} of ${mdBank.length.toLocaleString('en-US')} cards`);
    const first = cards()[0]!;
    const card = mdBank.find((c) => first.textContent?.startsWith(c.word))!;
    expect(within(first).getByText(card.difficulty)).toBeInTheDocument();
    expect(within(within(first).getByRole('list', { name: en.play.dontSay })).getAllByRole('listitem')).toHaveLength(card.banned.length);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('filters by difficulty and specialty, searches words and banned words, and clears', async () => {
    const user = userEvent.setup();
    inMd();
    const filters = within(screen.getByRole('group', { name: en.wordBank.difficulty }));
    await user.click(filters.getByRole('button', { name: 'Legend' }));
    await user.selectOptions(screen.getByRole('combobox', { name: en.wordBank.pickLabel.md }), 'cardiovascular');
    const expected = mdBank.filter((c) => c.difficulty === 'Legend' && c.specialty === 'cardiovascular');
    expect(status()).toHaveTextContent(`${expected.length} of`);
    expect(cards()).toHaveLength(expected.length);

    await user.click(screen.getByRole('button', { name: en.wordBank.clear }));
    await user.type(screen.getByRole('searchbox', { name: en.wordBank.label }), 'Fecalith');
    expect(screen.getByText('Appendicitis')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzqqq');
    expect(screen.getByText(en.wordBank.none)).toBeInTheDocument();
  });

  it('pages long lists with Show more, and offers categories in Unspoken', async () => {
    const user = userEvent.setup();
    renderApp(<WordBankScreen />);
    expect(cards()).toHaveLength(100);
    await user.click(screen.getByRole('button', { name: en.wordBank.more }));
    expect(cards()).toHaveLength(200);
    expect(screen.getByRole('combobox', { name: en.wordBank.pickLabel.unspoken })).toHaveDisplayValue(en.wordBank.all.unspoken);
  });
});
