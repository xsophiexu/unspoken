import { en, mdEn } from '@unspoken/content';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { catalogs } from '@/lib/catalog';
import { EDITION_STORAGE_KEY } from '@/lib/edition';
import { MD_SETTINGS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { HomeScreen } from '@/screens/HomeScreen';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { SetupScreen } from '@/screens/SetupScreen';
import { THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? 'null') as Record<string, unknown> | null;

// A returning player on the Card layout who has seen How to play, in either edition.
function returning(edition: 'md' | 'unspoken') {
  saved({
    [EDITION_STORAGE_KEY]: { edition, look: 'light', character: 'heart' },
    [TOUR_STORAGE_KEY]: en.howToPlay.version,
    [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' },
  });
}

// Home with the game beside it, as the app shows one after the other.
function renderHomeAndGame() {
  const result = renderApp(
    <>
      <HomeScreen />
      <section aria-label="game">
        <PlayScreen />
      </section>
    </>,
  );
  return { ...result, game: within(screen.getByRole('region', { name: 'game' })) };
}

const word = () => screen.getByRole('heading', { level: 1 }).textContent ?? '';
// The card's level as the bank files it.
const levelOf = (edition: 'md' | 'unspoken', text: string) => catalogs[edition].bank.find((c) => c.word === text)?.difficulty;

async function openDeepDive(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Deep dive/ }));
  return within(screen.getByRole('dialog', { name: en.deepDive.title }));
}

describe('Deep dive in UnspokenMD', () => {
  it('lists the 13 specialties with their cards, Easiest first on, and starts the picked one', async () => {
    const user = userEvent.setup();
    returning('md');
    const { router, game } = renderHomeAndGame();
    const sheet = await openDeepDive(user);
    expect(sheet.getByText('Pick one specialty. You get Normal to Legend.')).toBeInTheDocument();
    const specialties = within(sheet.getByRole('radiogroup', { name: mdEn.deepDive.listLabel }));
    expect(specialties.getAllByRole('radio')).toHaveLength(13);
    expect(specialties.getByRole('radio', { name: /^Cardiovascular/ })).toBeChecked();
    expect(sheet.getByRole('switch', { name: en.deepDive.easiestFirst.title })).toBeChecked();
    expect(sheet.getByText('Start at Normal and work up to Legend')).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: 'Start deep dive · 108 cards' })).toBeInTheDocument();

    await user.click(specialties.getByRole('radio', { name: /^Respiratory/ }));
    await user.click(sheet.getByRole('button', { name: 'Start deep dive · 58 cards' }));

    expect(router.push).toHaveBeenCalledWith('/play/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(game.getByText(en.deepDive.title)).toBeInTheDocument();
    expect(game.getByRole('button', { name: /^Deep dive: Respiratory/ })).toHaveTextContent(/^RESP$/);
    expect(game.getByText('Normal to Legend · 0 correct · 0 skipped')).toBeInTheDocument();
    expect(stored(MD_SETTINGS_STORAGE_KEY)).toMatchObject({ mode: 'zen', specialties: ['respiratory'], easiestFirst: true });
  });

  it('deals every Normal card first, each labeled with its difficulty, then Tricky', async () => {
    const user = userEvent.setup();
    returning('md');
    const { game } = renderHomeAndGame();
    const sheet = await openDeepDive(user);
    // Cardiovascular has 6 Normal cards.
    await user.click(sheet.getByRole('button', { name: /^Start deep dive/ }));
    for (let n = 0; n < 6; n++) {
      expect(levelOf('md', word())).toBe('Normal');
      expect(game.getByText('Your word · Normal')).toBeInTheDocument();
      await user.click(game.getByRole('button', { name: en.play.correct }));
      expect(await game.findByText(`Normal to Legend · ${n + 1} correct · 0 skipped`)).toBeInTheDocument();
    }
    expect(levelOf('md', word())).toBe('Tricky');
    expect(game.getByText('Your word · Tricky')).toBeInTheDocument();
  });

  it('mixes every difficulty with Easiest first off, still naming each card’s', async () => {
    const user = userEvent.setup();
    returning('md');
    const { game } = renderHomeAndGame();
    const sheet = await openDeepDive(user);
    await user.click(sheet.getByRole('switch', { name: en.deepDive.easiestFirst.title }));
    expect(sheet.getByText(en.deepDive.easiestFirst.off)).toBeInTheDocument();
    await user.click(sheet.getByRole('button', { name: /^Start deep dive/ }));

    const levels = [];
    for (let n = 0; n < 6; n++) {
      const level = levelOf('md', word());
      expect(game.getByText(`Your word · ${level}`)).toBeInTheDocument();
      levels.push(level);
      await user.click(game.getByRole('button', { name: en.play.skip }));
      expect(await game.findByText(`Normal to Legend · 0 correct · ${n + 1} skipped`)).toBeInTheDocument();
    }
    expect(levels.some((level) => level !== 'Normal')).toBe(true);
    expect(stored(MD_SETTINGS_STORAGE_KEY)).toMatchObject({ easiestFirst: false });
  });

  it('picks another specialty from the chip, and stays a Deep dive after a reload', async () => {
    const user = userEvent.setup();
    returning('md');
    const first = renderHomeAndGame();
    await user.click((await openDeepDive(user)).getByRole('button', { name: /^Start deep dive/ }));
    await user.click(first.game.getByRole('button', { name: /^Deep dive: Cardiovascular/ }));
    const sheet = within(screen.getByRole('dialog', { name: en.deepDive.title }));
    expect(sheet.getByRole('radio', { name: /^Cardiovascular/ })).toBeChecked();
    await user.click(sheet.getByRole('radio', { name: /^Biochemistry and Genetics/ }));
    await user.click(sheet.getByRole('button', { name: 'Start deep dive · 63 cards' }));
    expect(first.game.getByRole('button', { name: /^Deep dive: Biochemistry and Genetics/ })).toHaveTextContent(/^BIOCHEM$/);
    first.unmount();

    const { game } = renderHomeAndGame();
    expect(game.getByText(en.deepDive.title)).toBeInTheDocument();
    expect(game.getByText('Your word · Normal')).toBeInTheDocument();
  });
});

describe('Deep dive in Unspoken', () => {
  it('picks one of the app’s categories, from Easy to Legend', async () => {
    const user = userEvent.setup();
    returning('unspoken');
    const { game } = renderHomeAndGame();
    const sheet = await openDeepDive(user);
    expect(sheet.getByText('Pick one category. You get Easy to Legend.')).toBeInTheDocument();
    const categories = within(sheet.getByRole('radiogroup', { name: en.deepDive.listLabel }));
    expect(categories.getAllByRole('radio')).toHaveLength(20);
    expect(categories.getByRole('radio', { name: /^Halloween/ })).toBeInTheDocument();

    await user.click(categories.getByRole('radio', { name: /^Everyday Life/ }));
    await user.click(sheet.getByRole('button', { name: 'Start deep dive · 481 cards' }));
    expect(game.getByRole('button', { name: /^Deep dive: Everyday Life/ })).toHaveTextContent(/^EVERYDAY$/);
    expect(game.getByText('Easy to Legend · 0 correct · 0 skipped')).toBeInTheDocument();
    expect(levelOf('unspoken', word())).toBe('Easy');
    expect(game.getByText('Your word · Easy')).toBeInTheDocument();
    expect(stored(SETTINGS_STORAGE_KEY)).toMatchObject({ mode: 'endless', categories: ['Everyday Life'] });
  });
});

describe('Custom game', () => {
  it('opens New game titled Custom game, back to Home, dealing every card shuffled together', async () => {
    const user = userEvent.setup();
    returning('md');
    saved({ [MD_SETTINGS_STORAGE_KEY]: { mode: 'zen', difficulties: ['Tricky'], categories: [], specialties: [], easiestFirst: true } });
    renderApp(<SetupScreen mode="zen" fromHome />);
    expect(screen.getByRole('heading', { name: en.setup.customTitle })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.setup.backHome })).toHaveAttribute('href', '/');
    await user.click(screen.getByRole('button', { name: en.setup.start }));
    expect(stored(MD_SETTINGS_STORAGE_KEY)).not.toHaveProperty('easiestFirst');
  });

  it('keeps New game from Modes as it was', () => {
    returning('md');
    renderApp(<SetupScreen mode="zen" />);
    expect(screen.getByRole('heading', { name: en.setup.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.setup.back })).toHaveAttribute('href', '/modes/');
  });
});
