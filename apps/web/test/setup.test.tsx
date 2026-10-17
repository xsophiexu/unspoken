import { en } from '@unspoken/content';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { SetupScreen } from '@/screens/SetupScreen';

import { renderApp, saved } from './app';

const copy = en.setup;

describe('New game setup', () => {
  it('offers a timer and skips only where the mode has them', () => {
    const { unmount } = renderApp(<SetupScreen mode="classic" />);
    expect(screen.getByRole('textbox', { name: /Round timer 1:30/ })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: copy.skips })).toBeInTheDocument();
    unmount();

    renderApp(<SetupScreen mode="hotPotato" />);
    expect(screen.queryByRole('textbox', { name: /Round timer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: copy.skips })).not.toBeInTheDocument();
  });

  it('keeps All cards exclusive of picked categories', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="endless" />);
    const all = screen.getByRole('checkbox', { name: new RegExp(`^${en.themes.all}`) });
    const technology = screen.getByRole('checkbox', { name: /^Technology/ });
    expect(all).toBeChecked();

    await user.click(technology);
    expect(technology).toBeChecked();
    expect(all).not.toBeChecked();

    await user.click(all);
    expect(all).toBeChecked();
    expect(technology).not.toBeChecked();
  });

  it('types the timer like a microwave and needs the shortest round to start', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    const timer = screen.getByRole('textbox', { name: /Round timer/ });
    await user.clear(timer);
    await user.type(timer, '5');
    expect(timer).toHaveValue('0:05');
    expect(screen.getByRole('button', { name: copy.start })).toBeDisabled();
    await user.type(timer, '45');
    expect(timer).toHaveValue('5:45');
    expect(screen.getByRole('button', { name: copy.start })).toBeEnabled();
  });

  it('picks the renamed level for a player who saved an old level name', () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulty: 'Master 2', categories: [], skips: 3 } });
    renderApp(<SetupScreen mode="classic" />);
    expect(screen.getByRole('radio', { name: /^Elite/ })).toBeChecked();
    // No time was saved, so the timer follows the renamed level's default (4:00).
    expect(screen.getByRole('textbox', { name: /Round timer 4:00/ })).toBeInTheDocument();
  });

  it('starts the game it was set up for and opens Play', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(<SetupScreen mode="classic" />);
    await user.click(screen.getByRole('radio', { name: /^Elite/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Society/ }));
    await user.click(screen.getByRole('radio', { name: en.a11y.unlimitedSkips }));
    await user.click(screen.getByRole('button', { name: copy.start }));

    expect(router.push).toHaveBeenCalledWith('/');
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
      mode: 'classic',
      difficulty: 'Elite',
      categories: ['Society'],
      // The timer was on Hard's default, so it follows the new level.
      roundSeconds: 240,
      skips: null,
    });
  });
});
