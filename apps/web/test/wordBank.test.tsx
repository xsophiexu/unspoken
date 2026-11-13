import { en } from '@unspoken/content';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { catalogs } from '@/lib/catalog';
import { WordBankScreen } from '@/screens/WordBankScreen';
import { EDITION_STORAGE_KEY } from '@/lib/edition';

import { renderApp, saved } from './app';

const bank = catalogs.unspoken.bank;
const mdBank = catalogs.md.bank;
const rows = () => screen.getAllByRole('listitem');

describe('Word bank', () => {
  it('lists every Unspoken card by difficulty, read only, with a link back to the game', () => {
    renderApp(<WordBankScreen />);
    expect(screen.getByRole('link', { name: en.wordBank.back })).toHaveAttribute('href', '/play/');
    expect(rows()).toHaveLength(bank.length);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    const normal = within(screen.getByRole('region', { name: en.difficulties.Normal.name }));
    const word = bank.find((card) => card.difficulty === 'Normal')!.word;
    expect(normal.getByText(word)).toBeInTheDocument();
  });

  it('lists UnspokenMD’s cards with their specialty, and narrows to a search', async () => {
    const user = userEvent.setup();
    saved({ [EDITION_STORAGE_KEY]: { edition: 'md' } });
    renderApp(<WordBankScreen />);
    expect(rows()).toHaveLength(mdBank.length);

    await user.type(screen.getByRole('searchbox', { name: en.wordBank.label }), 'appendic');
    const found = mdBank.filter((card) => card.word.toLowerCase().includes('appendic'));
    expect(found.length).toBeGreaterThan(0);
    expect(rows()).toHaveLength(found.length);
    expect(screen.getByText(found[0]!.word)).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzqqq');
    expect(screen.getByText(en.wordBank.none)).toBeInTheDocument();
  });
});
