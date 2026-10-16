import { en } from '@unspoken/content';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motion } from '@unspoken/design-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { CustomizeScreen } from '@/screens/CustomizeScreen';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

const classic = { mode: 'classic', difficulty: 'Expert 1', categories: [], skips: 3 };

// The play screen in a labeled region, so queries skip anything else on the page (Customize's
// thumbnails draw the same screen).
function renderPlay(extra?: React.ReactNode) {
  const result = renderApp(
    <>
      {extra}
      <section aria-label="game">
        <PlayScreen />
      </section>
    </>,
  );
  return { ...result, game: within(screen.getByRole('region', { name: 'game' })) };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Play', () => {
  it('re-renders with the slots of the style picked on Customize', async () => {
    const user = userEvent.setup();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' } });
    const { game } = renderPlay(<CustomizeScreen />);

    // Card: the big mode name with a level badge, and swipe links.
    expect(game.getByRole('button', { name: 'Difficulty Expert 1. Tap to change.' })).toBeInTheDocument();
    expect(game.getByText(en.play.correctLink)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: en.customize.styles.split }));

    // Split: "Classic · Expert 1" in a pill, and a split bar with plain Skip and Correct.
    expect(game.queryByRole('button', { name: 'Difficulty Expert 1. Tap to change.' })).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Classic, Expert 1. Tap to change.' })).toBeInTheDocument();
    expect(game.queryByText(en.play.correctLink)).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: en.play.correct })).toHaveTextContent(en.play.correct);
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toMatchObject({ style: 'split' });
  });

  it('starts a new round when a difficulty is picked on the mode sheet', async () => {
    const user = userEvent.setup();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style: 'deck', color: 'teal', mode: 'light' } });
    const { game } = renderPlay();

    await user.click(game.getByRole('button', { name: en.play.skip }));
    expect(await game.findByText('2 skips left')).toBeInTheDocument();

    await user.click(game.getByRole('button', { name: 'Classic, Expert 1. Tap to change.' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText(en.modeSheet.note)).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Master 1' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Classic, Master 1. Tap to change.' })).toBeInTheDocument();
    expect(game.getByText('3 skips left')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ mode: 'classic', difficulty: 'Master 1' });
  });

  it('runs the clock, stops it while the menu is open, and answers from the keyboard', () => {
    vi.useFakeTimers();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic });
    const { game } = renderPlay();

    expect(game.getByRole('timer')).toHaveAccessibleName('2:30');
    act(() => vi.advanceTimersByTime(3000));
    expect(game.getByRole('timer')).toHaveAccessibleName('2:27');

    fireEvent.click(game.getByRole('button', { name: en.a11y.menu }));
    const menu = screen.getByRole('dialog');
    expect(within(menu).getByText('2:27 left · 0 pts · All cards')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    fireEvent.click(within(menu).getByRole('button', { name: en.menu.resume }));
    expect(game.getByRole('timer')).toHaveAccessibleName('2:27');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    act(() => vi.advanceTimersByTime(1000));
    expect(game.getByText('1 pt · 3 skips left')).toBeInTheDocument();
    expect(game.getByRole('timer')).toHaveAccessibleName('2:26');
  });

  it('opens How to play on the first game and not again once it is dismissed', async () => {
    const user = userEvent.setup();
    const first = renderPlay();
    const tour = screen.getByRole('dialog', { name: en.menu.howToPlay.title });
    expect(within(tour).getByText(en.howToPlay.steps[0]!.text)).toBeInTheDocument();
    await user.click(within(tour).getByRole('button', { name: en.howToPlay.play }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Coming back (a reload) goes straight to the game.
    first.unmount();
    const again = renderPlay();
    expect(again.game.getByText(en.play.correctLink)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the new How to play once to a player who saw an older one', async () => {
    const user = userEvent.setup();
    // The first rebuild saved true once its tour was closed.
    saved({ [TOUR_STORAGE_KEY]: true });
    const first = renderPlay();
    const tour = screen.getByRole('dialog', { name: en.menu.howToPlay.title });
    await user.click(within(tour).getByRole('button', { name: en.howToPlay.play }));

    first.unmount();
    renderPlay();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('steps through the walkthrough in the canvas order, rules included', () => {
    vi.useFakeTimers();
    renderPlay();
    const tour = screen.getByRole('dialog', { name: en.menu.howToPlay.title });
    const shown: string[] = [];
    for (let i = 0; i < en.howToPlay.steps.length; i++) {
      shown.push(within(tour).getAllByRole('paragraph').at(-1)!.textContent ?? '');
      act(() => vi.advanceTimersByTime(motion.spotlight.stepMs));
    }
    expect(shown).toEqual(['Get someone to guess a given word without saying any of the banned words.', 'This is the word they need to guess.', 'These are the banned words. Don’t say any of them.', 'Describe it out loud.', 'Tap here to change difficulty.', 'Tap here to change the game mode or the look.', 'Ready? Tap here to play.']);
  });

  it('keeps Hot potato’s rule under the controls while playing', () => {
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: { ...classic, mode: 'hotPotato' } });
    const { game } = renderPlay();
    expect(game.getByText(en.status.hotPotato)).toBeInTheDocument();
    expect(game.getByText(en.play.hotPotatoNote)).toBeInTheDocument();
  });

  it('still plays the default game when site storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const { game } = renderPlay();
    expect(game.getByText(en.modes.endless.name)).toBeInTheDocument();
    expect(game.getByText('0 correct · 0 skipped')).toBeInTheDocument();
  });
});
