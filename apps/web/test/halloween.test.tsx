import { bank, en } from '@unspoken/content';
import { FAVOURITE_STYLE_IDS, HALLOWEEN_STYLE_IDS, TIMER_LOOK_STYLE_IDS } from '@unspoken/design-tokens';
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

// The card being played, found in the bank by the word on screen.
function cardOnScreen(game: ReturnType<typeof within>) {
  const word = game.getByRole('heading', { level: 1 }).textContent;
  const card = bank.find((c) => c.word === word);
  expect(card).toBeDefined();
  return card;
}

const bannedOnScreen = (game: ReturnType<typeof within>) =>
  within(game.getByRole('region', { name: en.play.dontSay }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

// The candle's wax column (the 68-wide rect), whose height is the time left.
const wax = (region: HTMLElement) => Number(region.querySelector('rect[width="68"]')?.getAttribute('height'));

afterEach(() => {
  vi.useRealTimers();
});

describe('the Candle timer look on the play screen', () => {
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

  it('show the card being played: its word, its banned words and the real header', () => {
    const { game } = renderLook('candle');
    const card = cardOnScreen(game);
    const banned = bannedOnScreen(game);
    for (const word of banned) expect(card?.banned).toContain(word);
    expect(banned.length).toBeGreaterThanOrEqual(5);
    expect(game.getByRole('button', { name: 'Difficulty Hard. Tap to change.' })).toBeInTheDocument();
    expect(game.getByText('0 pts · 3 skips left')).toBeInTheDocument();
  });

  it('answer with Skip and Correct and open the menu', () => {
    vi.useFakeTimers();
    const { game } = renderLook('candle');
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

describe('Halloween favourite looks on the play screen', () => {
  // Graveyard (rows), Tarot (its own top row, the word on a card), Glowing chips (pill header,
  // split bar) and Haunted house (the words in the windows).
  it.each(['graveyard', 'tarot', 'glowingChips', 'hauntedHouse'])('%s shows the card being played with the real clock, level and stats', (style) => {
    vi.useFakeTimers();
    const { game, region } = renderLook(style);
    const card = cardOnScreen(game);
    const banned = bannedOnScreen(game);
    expect(banned).toEqual(card?.banned.slice(0, banned.length));
    expect(banned.length).toBeGreaterThanOrEqual(5);
    expect(region).toHaveTextContent(/0\s*pts/);
    expect(region).toHaveTextContent(/3\s*skips left/);
    expect(game.getByRole('button', { name: /Hard/ })).toBeInTheDocument();
    expect(game.getByRole('timer')).toHaveAccessibleName('1:00');
    act(() => vi.advanceTimersByTime(30_000));
    expect(game.getByRole('timer')).toHaveAccessibleName('0:30');
  });

  it('answer with Correct and Skip, pause, and open the menu (Vampire, with its own top row)', () => {
    vi.useFakeTimers();
    const { game } = renderLook('vampire');
    const first = game.getByRole('heading', { level: 1 }).textContent;
    fireEvent.click(game.getByRole('button', { name: en.play.correct }));
    act(() => vi.advanceTimersByTime(1000));
    expect(game.getByText('1 pt')).toBeInTheDocument();
    expect(game.getByRole('heading', { level: 1 }).textContent).not.toBe(first);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    act(() => vi.advanceTimersByTime(1000));
    expect(game.getByText('2 skips left')).toBeInTheDocument();

    fireEvent.click(game.getByRole('button', { name: en.a11y.pause }));
    expect(game.getByRole('dialog')).toHaveTextContent(en.paused.label);
    fireEvent.click(game.getByRole('button', { name: en.paused.resume }));
    fireEvent.click(game.getByRole('button', { name: en.a11y.menu }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('word the list their own way where the design does, keeping DON’T SAY as its name', () => {
    const { game } = renderLook('harvestMoon');
    const list = game.getByRole('region', { name: en.play.dontSay });
    expect(within(list).getByRole('heading', { level: 2 })).toHaveTextContent(en.play.dontSayLabels.rip);
  });

  it('show no clock when the round has no time limit (Witch hat, whose clock is the top row’s centre)', () => {
    const { game } = renderLook('witchHat', { ...classic, noTimeLimit: true });
    expect(game.queryByRole('timer')).not.toBeInTheDocument();
    expect(game.queryByRole('button', { name: en.a11y.pause })).not.toBeInTheDocument();
    expect(cardOnScreen(game)).toBeDefined();
    expect(game.getByRole('button', { name: en.a11y.menu })).toBeInTheDocument();
  });
});

describe('Halloween looks on Customize', () => {
  const groupRadios = () => screen.getAllByRole('group', { name: en.customize.groups.halloween }).flatMap((g) => within(g).getAllByRole('radio'));
  // A style's name is the last line of its option, under the live thumbnail.
  const nameOf = (radio: HTMLElement) => radio.closest('label')?.lastElementChild?.textContent;

  it('lists the favourites first, in Kurt’s order, then Candle, all under Halloween', () => {
    saved({ [THEME_STORAGE_KEY]: { style: 'ledger', color: 'rose', mode: 'light' } });
    renderApp(<CustomizeScreen />);
    expect(groupRadios().map(nameOf)).toEqual([...FAVOURITE_STYLE_IDS, ...TIMER_LOOK_STYLE_IDS].map((id) => en.customize.styles[id]));
    for (const name of ['Potion', 'Jack-o’-lantern', 'Hourglass', 'Moon', 'Spider']) expect(screen.queryByRole('radio', { name })).not.toBeInTheDocument();
  });

  it.each(['graveyard', 'hauntedHouse', 'candle'] as const)('hide color and light/dark while %s is picked, and keep them for other styles', async (id) => {
    const user = userEvent.setup();
    saved({ [THEME_STORAGE_KEY]: { style: 'ledger', color: 'rose', mode: 'light' } });
    renderApp(<CustomizeScreen />);
    expect(screen.getByRole('radiogroup', { name: `${en.customize.light} / ${en.customize.dark}` })).toBeInTheDocument();

    await user.click(groupRadios().find((r) => nameOf(r) === en.customize.styles[id]) as HTMLElement);
    expect(screen.queryByRole('radiogroup', { name: `${en.customize.light} / ${en.customize.dark}` })).not.toBeInTheDocument();
    expect(screen.queryByText(en.customize.color)).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-mode', 'dark');

    // Back on an everyday style, the saved color and mode are as they were.
    await user.click(screen.getByRole('radio', { name: en.customize.styles.ledger }));
    expect(screen.getByRole('radio', { name: en.customize.light })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-mode', 'light');
    expect(document.documentElement).toHaveAttribute('data-color', 'rose');
  });

  it('every Halloween look is on Customize', () => {
    renderApp(<CustomizeScreen />);
    expect(groupRadios()).toHaveLength(HALLOWEEN_STYLE_IDS.length);
  });
});

describe('a saved look that was removed (Potion, Jack-o’-lantern, Hourglass, Moon, Spider)', () => {
  it.each(['potion', 'jack', 'hourglass', 'moon', 'spider'])('%s plays in the default style, in the saved color and mode', (style) => {
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style, color: 'rose', mode: 'light' } });
    renderApp(<PlayScreen />);
    expect(document.documentElement).toHaveAttribute('data-style', 'card');
    expect(document.documentElement).toHaveAttribute('data-color', 'rose');
    expect(document.documentElement).toHaveAttribute('data-mode', 'light');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
