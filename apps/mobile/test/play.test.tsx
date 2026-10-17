import { en } from '@unspoken/content';
import { defaultRoundSeconds, format, formatClock } from '@unspoken/core';
import { gameMenu, motion, type RestartPlacement } from '@unspoken/design-tokens';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

import { openApp, resetDevice, savedPrefs } from './helpers';

// The Game paused layout switch (gameMenu.restartPlacement), made settable so both options can be
// played.
jest.mock('@unspoken/design-tokens', () => {
  const tokens = jest.requireActual('@unspoken/design-tokens');
  return { ...tokens, gameMenu: { ...tokens.gameMenu } };
});
const mockMenuLayout = gameMenu as { restartPlacement: RestartPlacement };

// The round clock ticks on a 1-second interval; fake timers keep it where the test leaves it.
beforeEach(async () => {
  jest.useFakeTimers();
  await resetDevice();
});
afterEach(() => {
  jest.useRealTimers();
  mockMenuLayout.restartPlacement = 'footer';
});

const levelBadge = (difficulty: string) => format(en.a11y.difficulty, { badge: difficulty });
const modePill = (mode: string, difficulty: string) => format(en.a11y.modeAndDifficulty, { mode, difficulty });

describe('a returning player', () => {
  it('plays at the renamed level when their saved settings use an old level name', async () => {
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic', difficulty: 'Master 1' as never, roundSeconds: defaultRoundSeconds('Expert') } });
    expect(await screen.findByLabelText(levelBadge('Expert'))).toBeOnTheScreen();
  });
});

describe('switching the style on Customize', () => {
  it('redraws the play screen with the new style’s slots and keeps the choice', async () => {
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic', difficulty: 'Tricky' } });

    // Card: the mode name with a level badge, and swipe bars without the "swipe the card" hint.
    expect(await screen.findByLabelText(levelBadge('Tricky'))).toBeOnTheScreen();
    expect(screen.queryByText(en.play.swipeTheCard)).not.toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    fireEvent.press(await screen.findByLabelText(en.menu.customize.title));

    // The style pages appear once the section knows its width.
    fireEvent(await screen.findByText(en.customize.style), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 400 } } });
    fireEvent.press(await screen.findByRole('radio', { name: en.customize.styles.deck }));
    fireEvent.press(screen.getByText(en.customize.done));

    // Deck: a mode pill instead of the badge, and the hint between Skip and Correct.
    expect(await screen.findByLabelText(modePill(en.modes.classic.name, 'Tricky'))).toBeOnTheScreen();
    expect(screen.getByText(en.play.swipeTheCard)).toBeOnTheScreen();
    expect(screen.queryByLabelText(levelBadge('Tricky'))).not.toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).theme.style).toBe('deck'));
  });
});

describe('picking a difficulty', () => {
  it('starts a new round at that level', async () => {
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic', difficulty: 'Tricky', roundSeconds: defaultRoundSeconds('Tricky') } });

    // Correct flies the card out, then counts.
    fireEvent.press(await screen.findByLabelText(en.play.correct));
    await act(async () => {
      jest.advanceTimersByTime(motion.swipe.flyOutMs);
    });
    expect(screen.getByText(/1 pt/)).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(levelBadge('Tricky')));
    fireEvent.press(await screen.findByRole('radio', { name: /^Hard/ }));

    // A fresh round: the new level and the score back to zero, saved for next time.
    expect(await screen.findByLabelText(levelBadge('Hard'))).toBeOnTheScreen();
    expect(screen.getByText(/0 pts/)).toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).settings.difficulty).toBe('Hard'));

    // ...with that level's full clock (the menu's status line shows the time left).
    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    expect(await screen.findByText(new RegExp(`^${formatClock(defaultRoundSeconds('Hard'))}`))).toBeOnTheScreen();
  });
});

describe('closing the ··· menu', () => {
  const closeAfterSlide = async () => {
    await act(async () => {
      jest.advanceTimersByTime(motion.duration.slow);
    });
  };

  it('closes on a tap on the dimmed backdrop', async () => {
    await openApp('/', { theme: { style: 'card' } });
    fireEvent.press(await screen.findByLabelText(en.a11y.menu));
    expect(await screen.findByText(en.menu.title)).toBeOnTheScreen();

    // The sheet is the modal view for screen readers, so the backdrop counts as hidden to queries.
    fireEvent.press(screen.getByLabelText(en.a11y.closeSheet, { includeHiddenElements: true }));
    await closeAfterSlide();
    expect(screen.queryByText(en.menu.title)).not.toBeOnTheScreen();
  });

  it('closes on the Android back button', async () => {
    await openApp('/', { theme: { style: 'card' } });
    fireEvent.press(await screen.findByLabelText(en.a11y.menu));
    const title = await screen.findByText(en.menu.title);

    // The system back press reaches the sheet's Modal as a close request.
    fireEvent(title, 'requestClose');
    await closeAfterSlide();
    expect(screen.queryByText(en.menu.title)).not.toBeOnTheScreen();
  });
});

describe('How to play', () => {
  const firstStep = en.howToPlay.steps[0]!.text;

  it('opens on the first game and not again once Play dismisses it', async () => {
    await openApp('/', { tour: {} });
    expect(await screen.findByText(firstStep)).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText(en.howToPlay.play));
    expect(screen.queryByText(firstStep)).not.toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).tourVersion).toBe(en.howToPlay.version));

    // Opening the app again goes straight to the game.
    screen.unmount();
    renderRouter('./src/app', { initialUrl: '/' });
    expect(await screen.findByLabelText(en.play.correct)).toBeOnTheScreen();
    expect(screen.queryByText(firstStep)).not.toBeOnTheScreen();
  });

  it('shows the new walkthrough once to a player who saw the older one', async () => {
    await openApp('/', { tour: { tourSeen: true } });
    expect(await screen.findByText(firstStep)).toBeOnTheScreen();
  });

  // The tour takes every touch over the game: a tap or a swipe left or up moves forward, a swipe
  // right or down goes back. touch() moves the finger by dx, dy.
  const touch = (tour: ReturnType<typeof screen.getByRole>, dx: number, dy = 0) => {
    fireEvent(tour, 'responderGrant', { nativeEvent: { pageX: 150, pageY: 400 } });
    fireEvent(tour, 'responderRelease', { nativeEvent: { pageX: 150 + dx, pageY: 400 + dy } });
  };
  const steps = en.howToPlay.steps.map((s) => s.text);

  it('stays on a step until it is tapped, however long it waits', async () => {
    await openApp('/', { tour: {} });
    expect(await screen.findByText(steps[0]!)).toBeOnTheScreen();
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByText(steps[0]!)).toBeOnTheScreen();
    expect(screen.queryByText(steps[1]!)).not.toBeOnTheScreen();
  });

  it('moves forward on a tap or a swipe left or up, and back on a swipe right or down, with no Back or Next buttons', async () => {
    await openApp('/', { tour: {} });
    const tour = await screen.findByRole('adjustable', { name: en.menu.howToPlay.title });
    expect(screen.queryByRole('button', { name: /^(Back|Next)$/ })).not.toBeOnTheScreen();

    // Going back on the first step stays there.
    touch(tour, 160);
    expect(screen.getByText(steps[0]!)).toBeOnTheScreen();

    touch(tour, 0);
    expect(screen.getByText(steps[1]!)).toBeOnTheScreen();
    touch(tour, -160);
    expect(screen.getByText(steps[2]!)).toBeOnTheScreen();
    touch(tour, 0, -160);
    expect(screen.getByText(steps[3]!)).toBeOnTheScreen();

    touch(tour, 160);
    expect(screen.getByText(steps[2]!)).toBeOnTheScreen();
    touch(tour, 0, 160);
    expect(screen.getByText(steps[1]!)).toBeOnTheScreen();
    // A short drag is neither: nothing moves.
    touch(tour, 24);
    expect(screen.getByText(steps[1]!)).toBeOnTheScreen();

    // Every step in order, and the last one stays until Play.
    for (const text of steps.slice(2)) {
      touch(tour, 2, 1);
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    touch(tour, 0);
    expect(screen.getByText(steps.at(-1)!)).toBeOnTheScreen();
  });
});

describe('Game paused', () => {
  const afterSlide = async () => {
    await act(async () => {
      jest.advanceTimersByTime(motion.duration.slow);
    });
  };

  it('opens How to play from the i beside the title', async () => {
    await openApp('/', { theme: { style: 'card' } });
    fireEvent.press(await screen.findByLabelText(en.a11y.menu));
    fireEvent.press(await screen.findByLabelText(en.menu.howToPlay.title));
    expect(await screen.findByText(en.howToPlay.steps[0]!.text)).toBeOnTheScreen();
  });

  it.each(['footer', 'header'] as const)('restarts the game from Restart with Restart in the %s', async (placement) => {
    mockMenuLayout.restartPlacement = placement;
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic' } });
    fireEvent.press(await screen.findByLabelText(en.play.correct));
    await act(async () => {
      jest.advanceTimersByTime(motion.swipe.flyOutMs);
    });
    expect(screen.getByText(/1 pt/)).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    const restart = await screen.findByLabelText(en.menu.restart);
    expect(within(restart).getByText(en.menu.restartShort)).toBeOnTheScreen();
    fireEvent.press(restart);
    await afterSlide();
    expect(screen.queryByText(en.menu.title)).not.toBeOnTheScreen();
    expect(screen.getByText(/0 pts/)).toBeOnTheScreen();
  });

  it.each(['footer', 'header'] as const)('closes on Resume with Restart in the %s', async (placement) => {
    mockMenuLayout.restartPlacement = placement;
    await openApp('/', { theme: { style: 'card' } });
    fireEvent.press(await screen.findByLabelText(en.a11y.menu));
    fireEvent.press(await screen.findByLabelText(en.menu.resume));
    await afterSlide();
    expect(screen.queryByText(en.menu.title)).not.toBeOnTheScreen();
  });

  it('says Change settings starts a new game', async () => {
    await openApp('/', { theme: { style: 'card' } });
    fireEvent.press(await screen.findByLabelText(en.a11y.menu));
    expect(await screen.findByLabelText(en.menu.changeSettings.title)).toBeOnTheScreen();
    expect(screen.getByText(/starts a new game/)).toBeOnTheScreen();
  });
});
