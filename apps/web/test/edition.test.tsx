import { en } from '@unspoken/content';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EDITION_STORAGE_KEY } from '@/lib/edition';
import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { CustomizeScreen } from '@/screens/CustomizeScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { bootScript, THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

const home = en.home;
const md = en.md.customize;
const html = () => document.documentElement;
const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? 'null') as Record<string, unknown> | null;
const quickPlay = () => screen.getByRole('link', { name: new RegExp(home.quickPlay.title) });

// The device's light or dark preference (the matchMedia boundary jsdom leaves out).
function prefersDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const name of ['data-style', 'data-color', 'data-mode']) html().removeAttribute(name);
});

describe('Home', () => {
  it('offers Quick Play with the last settings on one phone, and links to Modes, Customize and How to play', () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulties: ['Hard', 'Tough'], categories: [], skips: 3 } });
    renderApp(<HomeScreen />);
    expect(quickPlay()).toHaveAttribute('href', '/play/');
    expect(quickPlay()).toHaveTextContent('Classic · One phone · Hard+');
    const links = within(screen.getByRole('navigation', { name: home.links.label }));
    expect(links.getByRole('link', { name: home.links.modes })).toHaveAttribute('href', '/modes/');
    expect(links.getByRole('link', { name: home.links.customize })).toHaveAttribute('href', '/customize/');
    expect(links.getByRole('link', { name: home.links.howToPlay })).toHaveAttribute('href', '/play/?tour=1');
  });

  it('starts in Unspoken at Endless and Normal for a new player', () => {
    renderApp(<HomeScreen />);
    expect(screen.getByRole('radio', { name: /Everyday words/ })).toBeChecked();
    expect(quickPlay()).toHaveTextContent('Endless · One phone · Normal');
    expect(screen.getByRole('img')).toHaveAccessibleName(home.art.unspoken);
  });

  it('switches the whole app to UnspokenMD’s blue and back to the player’s color, and remembers the edition', async () => {
    const user = userEvent.setup();
    saved({ [THEME_STORAGE_KEY]: { style: 'card', color: 'clay', mode: 'light' } });
    renderApp(<HomeScreen />);
    expect(html()).toHaveAttribute('data-color', 'clay');

    await user.click(screen.getByRole('radio', { name: /Medical jargon/ }));
    expect(html()).toHaveAttribute('data-color', 'md');
    expect(quickPlay()).toHaveTextContent('Zen · One phone · Tricky');
    expect(screen.getByRole('img')).toHaveAccessibleName(home.art.md);
    expect(stored(EDITION_STORAGE_KEY)).toMatchObject({ edition: 'md' });

    await user.click(screen.getByRole('radio', { name: /Everyday words/ }));
    expect(html()).toHaveAttribute('data-color', 'clay');
    expect(stored(THEME_STORAGE_KEY)).toMatchObject({ color: 'clay' });
  });

  it('plays a saved Halloween look in Unspoken but the default layout in UnspokenMD, keeping the saved look', async () => {
    const user = userEvent.setup();
    saved({ [THEME_STORAGE_KEY]: { style: 'graveyard', color: 'teal', mode: 'light' } });
    renderApp(<HomeScreen />);
    expect(html()).toHaveAttribute('data-style', 'graveyard');
    expect(html()).toHaveAttribute('data-mode', 'dark');

    await user.click(screen.getByRole('radio', { name: /Medical jargon/ }));
    expect(html()).toHaveAttribute('data-style', 'card');
    expect(html()).toHaveAttribute('data-mode', 'light');

    await user.click(screen.getByRole('radio', { name: /Everyday words/ }));
    expect(html()).toHaveAttribute('data-style', 'graveyard');
  });
});

describe('Customize in UnspokenMD', () => {
  it('has a layout, a Look and a character, and no color choice or holiday looks', () => {
    saved({ [EDITION_STORAGE_KEY]: { edition: 'md' } });
    renderApp(<CustomizeScreen />);
    expect(screen.getByRole('radiogroup', { name: md.layout })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: en.customize.styles.graveyard })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: en.customize.color })).not.toBeInTheDocument();
    expect(screen.getByText(md.noColor)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: md.look })).toBeInTheDocument();
    expect(screen.getByText(en.md.characters.heart)).toBeInTheDocument();
  });

  it('draws in dark or the device’s setting from Look, without changing Unspoken’s mode', async () => {
    const user = userEvent.setup();
    prefersDark(true);
    saved({ [EDITION_STORAGE_KEY]: { edition: 'md' }, [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' } });
    renderApp(<CustomizeScreen />);
    expect(html()).toHaveAttribute('data-mode', 'light');

    await user.click(screen.getByRole('radio', { name: md.looks.system }));
    expect(html()).toHaveAttribute('data-mode', 'dark');
    expect(html()).toHaveAttribute('data-color', 'md');
    expect(stored(EDITION_STORAGE_KEY)).toMatchObject({ look: 'system' });
    expect(stored(THEME_STORAGE_KEY)).toMatchObject({ mode: 'light' });
  });

  it('picks a character from the sheet and saves it for lobbies', async () => {
    const user = userEvent.setup();
    saved({ [EDITION_STORAGE_KEY]: { edition: 'md' } });
    renderApp(<CustomizeScreen />);
    await user.click(screen.getByRole('button', { name: md.change }));
    const sheet = within(screen.getByRole('dialog', { name: md.pickerTitle }));
    expect(sheet.getAllByRole('radio')).toHaveLength(19);

    await user.click(sheet.getByRole('radio', { name: en.md.characters.kidney }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(en.md.characters.kidney)).toBeInTheDocument();
    expect(stored(EDITION_STORAGE_KEY)).toMatchObject({ character: 'kidney' });
  });

  it('leaves Unspoken’s Customize with its colors and holiday looks', () => {
    renderApp(<CustomizeScreen />);
    expect(screen.getByRole('radiogroup', { name: en.customize.color })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: en.customize.styles.graveyard })).toBeInTheDocument();
    expect(screen.queryByText(md.noColor)).not.toBeInTheDocument();
  });
});

describe('How to play in UnspokenMD', () => {
  it('opens from Home with the MD wordmark and its own first step', () => {
    saved({ [EDITION_STORAGE_KEY]: { edition: 'md' }, [TOUR_STORAGE_KEY]: en.howToPlay.version });
    renderApp(<PlayScreen tour />);
    const tour = within(screen.getByRole('dialog', { name: en.menu.howToPlay.title }));
    expect(tour.getByText(en.md.wordmark.base, { exact: false })).toHaveTextContent('unspokenmd');
    expect(tour.getByText('Get someone to guess a medical term without saying any of the banned jargon.')).toBeInTheDocument();
    expect(tour.getByText('Talk the way you would to a patient.')).toBeInTheDocument();
  });

  it('keeps Unspoken’s first step in Unspoken', () => {
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version });
    renderApp(<PlayScreen tour />);
    const tour = within(screen.getByRole('dialog', { name: en.menu.howToPlay.title }));
    expect(tour.getByText(en.howToPlay.steps[0]!.text)).toBeInTheDocument();
    expect(tour.queryByText('Talk the way you would to a patient.')).not.toBeInTheDocument();
  });
});

describe('the theme before first paint', () => {
  const runBoot = () => act(() => new Function(bootScript())());

  it('draws a returning UnspokenMD player in its blue and saved Look', () => {
    saved({ [EDITION_STORAGE_KEY]: { edition: 'md', look: 'dark' }, [THEME_STORAGE_KEY]: { style: 'witchHat', color: 'rose', mode: 'light' } });
    runBoot();
    expect(html()).toHaveAttribute('data-color', 'md');
    expect(html()).toHaveAttribute('data-mode', 'dark');
    expect(html()).toHaveAttribute('data-style', 'card');
  });

  it('draws a returning Unspoken player in their own style and color', () => {
    saved({ [THEME_STORAGE_KEY]: { style: 'ledger', color: 'rose', mode: 'dark' } });
    runBoot();
    expect(html()).toHaveAttribute('data-color', 'rose');
    expect(html()).toHaveAttribute('data-mode', 'dark');
    expect(html()).toHaveAttribute('data-style', 'ledger');
  });
});
