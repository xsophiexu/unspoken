import { en } from '@unspoken/content';
import { defaultRoundSeconds, format, formatClock, gameConfig, plural } from '@unspoken/core';
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

describe('Classic with No time limit', () => {
  it('shows no clock and never runs out of time; the round goes on until the player leaves it from the menu', async () => {
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic', difficulty: 'Tricky', roundSeconds: 30, noTimeLimit: true } });
    expect(await screen.findByLabelText(levelBadge('Tricky'))).toBeOnTheScreen();
    expect(screen.queryByText(formatClock(30))).not.toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.queryByText(en.over.timeUp)).not.toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(en.play.correct));
    await act(async () => {
      jest.advanceTimersByTime(motion.swipe.flyOutMs);
    });
    expect(screen.getByText(/1 pt/)).toBeOnTheScreen();

    // The menu still offers the ways out of a round.
    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    expect(await screen.findByLabelText(en.menu.changeSettings.title)).toBeOnTheScreen();
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

describe('changing the time limit on the Paused screen', () => {
  const afterSlide = async () => {
    await act(async () => {
      jest.advanceTimersByTime(motion.duration.slow);
    });
  };
  const seconds = (n: number) => act(async () => {
    jest.advanceTimersByTime(n * 1000);
  });
  const rowLabel = (value: string) => format(en.a11y.changeTimeLimit, { value });
  const step = plural(gameConfig.timeLimitStepSeconds, en.units.seconds);
  const typeTime = (from: string, digits: string) => {
    const box = screen.getByDisplayValue(from, { includeHiddenElements: true });
    fireEvent(box, 'focus');
    fireEvent.changeText(box, digits);
    fireEvent(box, 'blur');
  };

  async function pauseClassic(settings: Record<string, unknown> = {}) {
    // Deck: its timer chip carries the pause button.
    await openApp('/', { theme: { style: 'deck' }, settings: { mode: 'classic', difficulty: 'Hard', roundSeconds: 150, ...settings } });
    await screen.findByLabelText(modePill(en.modes.classic.name, 'Hard'));
    await seconds(9);
    fireEvent.press(screen.getByLabelText(en.a11y.pause));
    expect(await screen.findByText(en.paused.label)).toBeOnTheScreen();
  }

  it('saves a longer time for the next turn while this turn keeps its time left', async () => {
    await pauseClassic();
    expect(screen.getByText('2:21')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText(rowLabel('2:30')));

    expect(await screen.findByText(en.timeLimit.title)).toBeOnTheScreen();
    expect(screen.getByText(format(en.timeLimit.keepsClock, { clock: '2:21' }))).toBeOnTheScreen();
    for (let i = 0; i < 3; i++) fireEvent.press(screen.getByLabelText(format(en.a11y.longer, { step })));
    expect(screen.getByText('3:15')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText(en.timeLimit.save));
    await afterSlide();

    // Back on Paused: the row shows the new time and says when it starts; the clock is untouched.
    expect(screen.queryByText(en.timeLimit.title)).not.toBeOnTheScreen();
    expect(screen.getByLabelText(rowLabel('3:15'))).toBeOnTheScreen();
    expect(screen.getByText(en.paused.startsNextTurn)).toBeOnTheScreen();
    expect(screen.getByText('2:21')).toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).settings).toMatchObject({ roundSeconds: 195, noTimeLimit: false }));

    // Resume carries on from 2:21.
    fireEvent.press(screen.getByLabelText(en.paused.resume));
    await seconds(1);
    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    expect(await screen.findByText(/^2:20 left/)).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText(en.menu.restart));
    await afterSlide();

    // The next turn starts at the new length.
    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    expect(await screen.findByText(/^3:15 left/)).toBeOnTheScreen();
  });

  it('takes a typed time with seconds rolling into minutes, and waits for one from 0:30 to 10:00', async () => {
    await pauseClassic();
    fireEvent.press(screen.getByLabelText(rowLabel('2:30')));
    await screen.findByText(en.timeLimit.title);
    const note = format(en.setup.timerOutOfRange, { min: '0:30', max: '10:00' });

    typeTime('230', '1275');
    expect(screen.getByText('13:15')).toBeOnTheScreen();
    expect(screen.getByText(note)).toBeOnTheScreen();
    expect(screen.getByLabelText(en.timeLimit.save)).toBeDisabled();

    // − brings it back inside the range.
    fireEvent.press(screen.getByLabelText(format(en.a11y.shorter, { step })));
    expect(screen.getByText('9:45')).toBeOnTheScreen();
    expect(screen.queryByText(note)).not.toBeOnTheScreen();

    typeTime('945', '20');
    expect(screen.getByText(note)).toBeOnTheScreen();
    typeTime('20', '175');
    expect(screen.getByText('2:15')).toBeOnTheScreen();
    expect(screen.queryByText(note)).not.toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText(en.timeLimit.save));
    await waitFor(async () => expect((await savedPrefs()).settings.roundSeconds).toBe(135));
  });

  it('turns the time limit off from the next turn; this turn still runs out', async () => {
    await pauseClassic();
    fireEvent.press(screen.getByLabelText(rowLabel('2:30')));
    await screen.findByText(en.timeLimit.title);
    fireEvent.press(screen.getByRole('switch', { name: en.timeLimit.noTimeLimit.title }));
    expect(screen.getByText(en.timeLimit.noLimit)).toBeOnTheScreen();
    expect(screen.getByLabelText(format(en.a11y.longer, { step }))).toBeDisabled();
    fireEvent.press(screen.getByLabelText(en.timeLimit.save));
    await afterSlide();

    expect(screen.getByLabelText(rowLabel(en.paused.noLimit))).toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).settings).toMatchObject({ noTimeLimit: true, roundSeconds: 150 }));

    fireEvent.press(screen.getByLabelText(en.paused.resume));
    await seconds(141);
    expect(await screen.findByText(en.over.timeUp)).toBeOnTheScreen();

    // Play again: no clock this time.
    fireEvent.press(screen.getByLabelText(en.over.playAgain));
    await seconds(10 * 60);
    expect(screen.queryByText(en.over.timeUp)).not.toBeOnTheScreen();
  });

  it('leaves the time limit as it was when the changer is closed without saving', async () => {
    await pauseClassic();
    fireEvent.press(screen.getByLabelText(rowLabel('2:30')));
    await screen.findByText(en.timeLimit.title);
    fireEvent.press(screen.getByLabelText(format(en.a11y.longer, { step })));
    fireEvent.press(screen.getByLabelText(en.a11y.closeMenu));
    await afterSlide();

    expect(screen.getByLabelText(rowLabel('2:30'))).toBeOnTheScreen();
    expect(screen.queryByText(en.paused.startsNextTurn)).not.toBeOnTheScreen();
    expect((await savedPrefs()).settings.roundSeconds).toBe(150);
  });
});
