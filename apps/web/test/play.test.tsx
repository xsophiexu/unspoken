import { en } from '@unspoken/content';
import { format, gameConfig, plural } from '@unspoken/core';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { CustomizeScreen } from '@/screens/CustomizeScreen';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

const classic = { mode: 'classic', difficulty: 'Hard', categories: [], skips: 3 };

// The Game paused layout switch (gameMenu.restartPlacement), so both options can be played.
const menuLayout = vi.hoisted(() => ({ restartPlacement: 'footer' as 'footer' | 'header' }));
vi.mock('@unspoken/design-tokens', async (importOriginal) => ({ ...(await importOriginal<object>()), gameMenu: menuLayout }));

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
  menuLayout.restartPlacement = 'footer';
});

describe('Play', () => {
  it('re-renders with the slots of the style picked on Customize', async () => {
    const user = userEvent.setup();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' } });
    const { game } = renderPlay(<CustomizeScreen />);

    // Card: the big mode name with a level badge, and swipe links.
    expect(game.getByRole('button', { name: 'Difficulty Hard. Tap to change.' })).toBeInTheDocument();
    expect(game.getByText(en.play.correctLink)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: en.customize.styles.split }));

    // Split: "Classic · Hard" in a pill, and a split bar with plain Skip and Correct.
    expect(game.queryByRole('button', { name: 'Difficulty Hard. Tap to change.' })).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Classic, Hard. Tap to change.' })).toBeInTheDocument();
    expect(game.queryByText(en.play.correctLink)).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: en.play.correct })).toHaveTextContent(en.play.correct);
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toMatchObject({ style: 'split' });
  });

  it('names several picked difficulties by the easiest one and a plus', () => {
    saved({
      [TOUR_STORAGE_KEY]: en.howToPlay.version,
      [SETTINGS_STORAGE_KEY]: { ...classic, difficulty: undefined, difficulties: ['Expert', 'Hard', 'Tough'] },
      [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' },
    });
    const { game } = renderPlay();
    const badge = game.getByRole('button', { name: 'Difficulty Hard+. Tap to change.' });
    expect(badge).toHaveTextContent('HARD+');
  });

  it('starts a new round when a difficulty is picked on the mode sheet', async () => {
    const user = userEvent.setup();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style: 'deck', color: 'teal', mode: 'light' } });
    const { game } = renderPlay();

    await user.click(game.getByRole('button', { name: en.play.skip }));
    expect(await game.findByText('2 skips left')).toBeInTheDocument();

    await user.click(game.getByRole('button', { name: 'Classic, Hard. Tap to change.' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText(en.modeSheet.note)).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Expert' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Classic, Expert. Tap to change.' })).toBeInTheDocument();
    expect(game.getByText('3 skips left')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ mode: 'classic', difficulties: ['Expert'] });
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

  it('stays on a step until it is tapped, however long it waits', () => {
    vi.useFakeTimers();
    renderPlay();
    const tour = screen.getByRole('dialog', { name: en.menu.howToPlay.title });
    act(() => vi.advanceTimersByTime(60_000));
    expect(within(tour).getByText(en.howToPlay.steps[0]!.text)).toBeInTheDocument();
    expect(within(tour).queryByText(en.howToPlay.steps[1]!.text)).not.toBeInTheDocument();
  });

  it('moves forward on a tap or a swipe left or up, and back on a swipe right or down, a scroll back or the left arrow, with no Back or Next buttons', () => {
    renderPlay();
    const tour = screen.getByRole('dialog', { name: en.menu.howToPlay.title });
    const caption = () => within(tour).getAllByRole('paragraph').at(-1)!.textContent;
    const tap = () => fireEvent.click(tour);
    const swipe = (dx: number, dy: number) => {
      fireEvent.pointerDown(tour, { clientX: 150, clientY: 400 });
      fireEvent.pointerUp(tour, { clientX: 150 + dx, clientY: 400 + dy });
      fireEvent.click(tour);
    };
    expect(within(tour).getAllByRole('button').map((b) => b.textContent)).toEqual([en.howToPlay.play]);

    // Every step in the canvas order, rules included, one tap each; the last stays until Play.
    const shown: string[] = [];
    for (let i = 0; i < en.howToPlay.steps.length; i++) {
      shown.push(caption() ?? '');
      tap();
    }
    expect(shown).toEqual(['Get someone to guess a given word without saying any of the banned words.', 'This is the word they need to guess.', 'These are the banned words. Don’t say any of them.', 'Describe it out loud.', 'Tap here to change difficulty.', 'Tap here to change the game mode or the look.', 'Ready? Tap here to play.']);
    expect(caption()).toBe('Ready? Tap here to play.');

    swipe(160, 0);
    expect(caption()).toBe('Tap here to change the game mode or the look.');
    swipe(0, 160);
    expect(caption()).toBe('Tap here to change difficulty.');
    fireEvent.wheel(tour, { deltaY: -80 });
    expect(caption()).toBe('Describe it out loud.');
    fireEvent.keyDown(tour, { key: 'ArrowLeft' });
    expect(caption()).toBe('These are the banned words. Don’t say any of them.');
    tap();
    expect(caption()).toBe('Describe it out loud.');
    swipe(-160, 0);
    expect(caption()).toBe('Tap here to change difficulty.');
    swipe(0, -160);
    expect(caption()).toBe('Tap here to change the game mode or the look.');
  });

  it('keeps Hot Potato’s rule under the controls while playing', () => {
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

describe('Game paused', () => {
  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' } });
    const { game } = renderPlay();
    await user.click(game.getByRole('button', { name: en.a11y.menu }));
    return { game, menu: screen.getByRole('dialog', { name: en.menu.title }) };
  };

  it('opens How to play from the i beside the title', async () => {
    const user = userEvent.setup();
    const { menu } = await openMenu(user);
    await user.click(within(menu).getByRole('button', { name: en.menu.howToPlay.title }));

    expect(screen.queryByRole('dialog', { name: en.menu.title })).not.toBeInTheDocument();
    const tour = screen.getByRole('dialog', { name: en.menu.howToPlay.title });
    expect(within(tour).getByText(en.howToPlay.steps[0]!.text)).toBeInTheDocument();
  });

  it.each(['footer', 'header'] as const)('restarts the game from Restart with Restart in the %s', async (placement) => {
    menuLayout.restartPlacement = placement;
    const user = userEvent.setup();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: classic, [THEME_STORAGE_KEY]: { style: 'deck', color: 'teal', mode: 'light' } });
    const { game } = renderPlay();
    await user.click(game.getByRole('button', { name: en.play.skip }));
    expect(await game.findByText('2 skips left')).toBeInTheDocument();

    // Deck's sliders button opens the same menu.
    await user.click(game.getByRole('button', { name: en.a11y.customize }));
    const restart = within(screen.getByRole('dialog')).getByRole('button', { name: en.menu.restart });
    expect(restart).toHaveTextContent(en.menu.restartShort);
    await user.click(restart);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(game.getByText('3 skips left')).toBeInTheDocument();
  });

  it.each(['footer', 'header'] as const)('closes on Resume with Restart in the %s', async (placement) => {
    menuLayout.restartPlacement = placement;
    const user = userEvent.setup();
    const { menu } = await openMenu(user);
    await user.click(within(menu).getByRole('button', { name: en.menu.resume }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says Change settings starts a new game', async () => {
    const user = userEvent.setup();
    const { menu } = await openMenu(user);
    expect(within(menu).getByRole('link', { name: new RegExp(en.menu.changeSettings.title) })).toHaveTextContent(/starts a new game/);
  });
});

describe('Changing the time limit on the Paused screen', () => {
  const step = plural(gameConfig.timeLimitStepSeconds, en.units.seconds);
  const rowName = (value: string) => format(en.a11y.changeTimeLimit, { value });
  const note = format(en.setup.timerOutOfRange, { min: '0:30', max: '10:00' });
  const savedSettings = () => JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');

  // Classic at Hard (2:30), paused by the player 9 seconds in.
  function pauseClassic() {
    vi.useFakeTimers();
    saved({ [TOUR_STORAGE_KEY]: en.howToPlay.version, [SETTINGS_STORAGE_KEY]: { ...classic, roundSeconds: 150 } });
    const view = renderPlay();
    act(() => vi.advanceTimersByTime(9000));
    fireEvent.click(view.game.getByRole('button', { name: en.a11y.pause }));
    const paused = screen.getByRole('dialog', { name: en.paused.label });
    return { ...view, paused: within(paused) };
  }
  const openChanger = (paused: ReturnType<typeof within>, value = '2:30') => {
    fireEvent.click(paused.getByRole('button', { name: rowName(value) }));
    return within(screen.getByRole('dialog', { name: en.timeLimit.title }));
  };
  const typeTime = (sheet: ReturnType<typeof within>, from: string, digits: string) => {
    const box = sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: from }) });
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: digits } });
    fireEvent.blur(box);
  };

  it('saves a longer time for the next turn while this turn keeps its time left', () => {
    const { game, paused } = pauseClassic();
    expect(paused.getByText('2:21')).toBeInTheDocument();
    const sheet = openChanger(paused);
    expect(sheet.getByText(format(en.timeLimit.keepsClock, { clock: '2:21' }))).toBeInTheDocument();

    for (let i = 0; i < 3; i++) fireEvent.click(sheet.getByRole('button', { name: format(en.a11y.longer, { step }) }));
    expect(sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: '3:15' }) })).toBeInTheDocument();
    fireEvent.click(sheet.getByRole('button', { name: en.timeLimit.save }));

    expect(screen.queryByRole('dialog', { name: en.timeLimit.title })).not.toBeInTheDocument();
    expect(paused.getByRole('button', { name: rowName('3:15') })).toHaveTextContent(en.paused.startsNextTurn);
    expect(paused.getByText('2:21')).toBeInTheDocument();
    expect(savedSettings()).toMatchObject({ roundSeconds: 195, noTimeLimit: false });

    // Resume carries on from 2:21; the next turn starts at 3:15.
    fireEvent.click(paused.getByRole('button', { name: en.paused.resume }));
    act(() => vi.advanceTimersByTime(1000));
    expect(game.getByRole('timer')).toHaveAccessibleName('2:20');
    fireEvent.click(game.getByRole('button', { name: en.a11y.pause }));
    fireEvent.click(screen.getByRole('button', { name: en.paused.newGame }));
    expect(game.getByRole('timer')).toHaveAccessibleName('3:15');
  });

  it('moves the time with the slider', () => {
    const { paused } = pauseClassic();
    const sheet = openChanger(paused);
    fireEvent.change(sheet.getByRole('slider', { name: en.a11y.timeLimitSlider }), { target: { value: '600' } });
    expect(sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: '10:00' }) })).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: format(en.a11y.longer, { step }) })).toBeDisabled();
  });

  it('takes a typed time with seconds rolling into minutes, and waits for one from 0:30 to 10:00', () => {
    const { paused } = pauseClassic();
    const sheet = openChanger(paused);

    typeTime(sheet, '2:30', '1275');
    expect(sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: '13:15' }) })).toBeInTheDocument();
    expect(sheet.getByText(note)).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: en.timeLimit.save })).toBeDisabled();

    // − brings it back inside the range.
    fireEvent.click(sheet.getByRole('button', { name: format(en.a11y.shorter, { step }) }));
    expect(sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: '9:45' }) })).toBeInTheDocument();
    expect(sheet.queryByText(note)).not.toBeInTheDocument();

    typeTime(sheet, '9:45', '20');
    expect(sheet.getByText(note)).toBeInTheDocument();
    typeTime(sheet, '0:20', '175');
    expect(sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: '2:15' }) })).toBeInTheDocument();
    fireEvent.click(sheet.getByRole('button', { name: en.timeLimit.save }));
    expect(savedSettings()).toMatchObject({ roundSeconds: 135 });
  });

  it('turns the time limit off from the next turn; this turn still runs out', () => {
    const { game, paused } = pauseClassic();
    const sheet = openChanger(paused);
    fireEvent.click(sheet.getByRole('switch', { name: en.a11y.noTimeLimit }));
    expect(sheet.getByText(en.setup.noClock)).toBeInTheDocument();
    // The time stays, greyed, for when the switch goes off.
    expect(sheet.getByRole('textbox', { name: format(en.a11y.timer, { clock: '2:30' }) })).toBeDisabled();
    expect(sheet.getByRole('slider', { name: en.a11y.timeLimitSlider })).toBeDisabled();
    fireEvent.click(sheet.getByRole('button', { name: en.timeLimit.save }));

    expect(paused.getByRole('button', { name: rowName(en.paused.noLimit) })).toBeInTheDocument();
    expect(savedSettings()).toMatchObject({ noTimeLimit: true, roundSeconds: 150 });

    fireEvent.click(paused.getByRole('button', { name: en.paused.resume }));
    act(() => vi.advanceTimersByTime(141_000));
    fireEvent.click(screen.getByRole('button', { name: en.over.playAgain }));
    expect(game.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('leaves the time limit as it was when the changer is closed without saving', () => {
    const { paused } = pauseClassic();
    const sheet = openChanger(paused);
    fireEvent.click(sheet.getByRole('button', { name: format(en.a11y.longer, { step }) }));
    fireEvent.click(sheet.getByRole('button', { name: en.a11y.closeMenu }));

    expect(paused.getByRole('button', { name: rowName('2:30') })).not.toHaveTextContent(en.paused.startsNextTurn);
    expect(savedSettings()).toMatchObject({ roundSeconds: 150 });
  });
});
