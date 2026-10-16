import { en } from '@unspoken/content';
import { defaultRoundSeconds, format, formatClock } from '@unspoken/core';
import { motion } from '@unspoken/design-tokens';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { openApp, resetDevice, savedPrefs } from './helpers';

// The round clock ticks on a 1-second interval; fake timers keep it where the test leaves it.
beforeEach(async () => {
  jest.useFakeTimers();
  await resetDevice();
});
afterEach(() => {
  jest.useRealTimers();
});

const levelBadge = (difficulty: string) => format(en.a11y.difficulty, { badge: difficulty });
const modePill = (mode: string, difficulty: string) => format(en.a11y.modeAndDifficulty, { mode, difficulty });

describe('switching the style on Customize', () => {
  it('redraws the play screen with the new style’s slots and keeps the choice', async () => {
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic', difficulty: 'Harder' } });

    // Card: the mode name with a level badge, and swipe bars without the "swipe the card" hint.
    expect(await screen.findByLabelText(levelBadge('Harder'))).toBeOnTheScreen();
    expect(screen.queryByText(en.play.swipeTheCard)).not.toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    fireEvent.press(await screen.findByLabelText(en.menu.customize.title));

    // The style pages appear once the section knows its width.
    fireEvent(await screen.findByText(en.customize.style), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 400 } } });
    fireEvent.press(await screen.findByRole('radio', { name: en.customize.styles.deck }));
    fireEvent.press(screen.getByText(en.customize.done));

    // Deck: a mode pill instead of the badge, and the hint between Skip and Correct.
    expect(await screen.findByLabelText(modePill(en.modes.classic.name, 'Harder'))).toBeOnTheScreen();
    expect(screen.getByText(en.play.swipeTheCard)).toBeOnTheScreen();
    expect(screen.queryByLabelText(levelBadge('Harder'))).not.toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).theme.style).toBe('deck'));
  });
});

describe('picking a difficulty', () => {
  it('starts a new round at that level', async () => {
    await openApp('/', { theme: { style: 'card' }, settings: { mode: 'classic', difficulty: 'Harder', roundSeconds: defaultRoundSeconds('Harder') } });

    // Correct flies the card out, then counts.
    fireEvent.press(await screen.findByLabelText(en.play.correct));
    await act(async () => {
      jest.advanceTimersByTime(motion.swipe.flyOutMs);
    });
    expect(screen.getByText(/1 pt/)).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(levelBadge('Harder')));
    fireEvent.press(await screen.findByRole('radio', { name: /^Expert 1/ }));

    // A fresh round: the new level and the score back to zero, saved for next time.
    expect(await screen.findByLabelText(levelBadge('Expert 1'))).toBeOnTheScreen();
    expect(screen.getByText(/0 pts/)).toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).settings.difficulty).toBe('Expert 1'));

    // ...with that level's full clock (the menu's status line shows the time left).
    fireEvent.press(screen.getByLabelText(en.a11y.menu));
    expect(await screen.findByText(new RegExp(`^${formatClock(defaultRoundSeconds('Expert 1'))}`))).toBeOnTheScreen();
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
});
