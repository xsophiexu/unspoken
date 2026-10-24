import { bank, en } from '@unspoken/content';
import { HALLOWEEN_STYLE_IDS } from '@unspoken/design-tokens';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { CustomizeScreen } from '@/screens/CustomizeScreen';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

const classic = { mode: 'classic', difficulty: 'Hard', categories: [], skips: 3, roundSeconds: 60 };

function renderLook(style: string, settings: object = classic) {
  saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: settings, [THEME_STORAGE_KEY]: { style, color: 'teal', mode: 'light' } });
  const result = renderApp(
    <section aria-label="game">
      <PlayScreen />
    </section>,
  );
  const region = screen.getByRole('region', { name: 'game' });
  return { ...result, region, game: within(region) };
}

// The candle's wax column (the 68-wide rect), whose height is the time left.
const wax = (region: HTMLElement) => Number(region.querySelector('rect[width="68"]')?.getAttribute('height'));
// The spider's place on its thread.
const spiderY = (region: HTMLElement) => Number(/translate\(300 ([\d.]+)\)/.exec(region.innerHTML)?.[1]);

afterEach(() => {
  vi.useRealTimers();
});

describe('Halloween looks on the play screen', () => {
  it('melt the candle as the round clock runs, and keep it while paused', () => {
    vi.useFakeTimers();
    const { game, region } = renderLook('candle');
    expect(game.getByRole('timer')).toHaveAccessibleName('1:00');
    const full = wax(region);

    act(() => vi.advanceTimersByTime(30_000));
    expect(game.getByRole('timer')).toHaveAccessibleName('0:30');
    const half = wax(region);
    expect(half).toBeLessThan(full);

    fireEvent.click(game.getByRole('button', { name: en.a11y.pause }));
    expect(game.getByRole('dialog')).toHaveTextContent(en.paused.label);
    act(() => vi.advanceTimersByTime(10_000));
    expect(wax(region)).toBe(half);

    fireEvent.click(game.getByRole('button', { name: en.paused.resume }));
    act(() => vi.advanceTimersByTime(30_000));
    expect(wax(region)).toBeLessThan(half);
  });

  it('lower the spider as time passes', () => {
    vi.useFakeTimers();
    const { region } = renderLook('spider');
    const start = spiderY(region);
    act(() => vi.advanceTimersByTime(20_000));
    expect(spiderY(region)).toBeGreaterThan(start);
  });

  it('show the card being played: its word, its banned words and the real header', () => {
    const { game } = renderLook('potion');
    const word = game.getByRole('heading', { level: 1 }).textContent;
    const card = bank.find((c) => c.word === word);
    expect(card).toBeDefined();
    const banned = within(game.getByRole('region', { name: en.play.dontSay })).getAllByRole('listitem');
    for (const li of banned) expect(card?.banned).toContain(li.textContent);
    expect(banned.length).toBeGreaterThanOrEqual(5);
    expect(game.getByRole('button', { name: 'Difficulty Hard. Tap to change.' })).toBeInTheDocument();
    expect(game.getByText('0 pts · 3 skips left')).toBeInTheDocument();
  });

  it('answer with Skip and Correct and open the menu', () => {
    vi.useFakeTimers();
    const { game } = renderLook('moon');
    const first = game.getByRole('heading', { level: 1 }).textContent;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    act(() => vi.advanceTimersByTime(1000));
    expect(game.getByText('1 pt · 3 skips left')).toBeInTheDocument();
    fireEvent.click(game.getByRole('button', { name: en.play.skip }));
    act(() => vi.advanceTimersByTime(1000));
    expect(game.getByText('1 pt · 2 skips left')).toBeInTheDocument();
    expect(game.getByRole('heading', { level: 1 }).textContent).not.toBe(first);
    fireEvent.click(game.getByRole('button', { name: en.a11y.menu }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('draw the full picture with no clock when the round has no time limit', () => {
    vi.useFakeTimers();
    const timed = renderLook('candle');
    const full = wax(timed.region);
    timed.unmount();

    const { game, region } = renderLook('candle', { ...classic, noTimeLimit: true });
    expect(game.queryByRole('timer')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30_000));
    expect(wax(region)).toBe(full);
    expect(game.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('Halloween looks on Customize', () => {
  it('are listed together under Halloween, and hide color and light/dark while one is picked', async () => {
    const user = userEvent.setup();
    saved({ [THEME_STORAGE_KEY]: { style: 'ledger', color: 'rose', mode: 'light' } });
    renderApp(<CustomizeScreen />);

    const group = screen.getByRole('group', { name: en.customize.groups.halloween });
    for (const id of HALLOWEEN_STYLE_IDS) expect(within(group).getByRole('radio', { name: en.customize.styles[id] })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: `${en.customize.light} / ${en.customize.dark}` })).toBeInTheDocument();

    await user.click(within(group).getByRole('radio', { name: en.customize.styles.jack }));
    expect(screen.queryByRole('radiogroup', { name: `${en.customize.light} / ${en.customize.dark}` })).not.toBeInTheDocument();
    expect(screen.queryByText(en.customize.color)).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-mode', 'dark');

    // Back on an everyday style, the saved color and mode are as they were.
    await user.click(screen.getByRole('radio', { name: en.customize.styles.ledger }));
    expect(screen.getByRole('radio', { name: en.customize.light })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-mode', 'light');
    expect(document.documentElement).toHaveAttribute('data-color', 'rose');
  });
});
