import { en } from '@unspoken/content';
import { defaultRoundSeconds, format, formatClock } from '@unspoken/core';
import { motion } from '@unspoken/design-tokens';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';

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
