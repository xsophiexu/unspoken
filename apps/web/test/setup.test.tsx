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
    expect(screen.getByRole('textbox', { name: /Time limit 1:30/ })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: copy.skips })).toBeInTheDocument();
    unmount();

    renderApp(<SetupScreen mode="hotPotato" />);
    expect(screen.queryByRole('textbox', { name: /Time limit/ })).not.toBeInTheDocument();
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

  it('types the time limit like a microwave and shows the accepted range', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    expect(screen.getByText('0:30 to 10:00')).toBeInTheDocument();
    const timer = screen.getByRole('textbox', { name: /Time limit/ });
    await user.clear(timer);
    await user.type(timer, '5');
    expect(timer).toHaveValue('0:05');
    await user.type(timer, '45');
    expect(timer).toHaveValue('5:45');
    expect(screen.getByRole('button', { name: copy.start })).toBeEnabled();
  });

  it('notes a time outside 0:30 to 10:00 once the box loses focus, and holds Start until it is fixed', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    const timer = screen.getByRole('textbox', { name: /Time limit/ });
    const start = screen.getByRole('button', { name: copy.start });
    await user.clear(timer);
    await user.type(timer, '1200');
    // Still typing: no note yet.
    expect(screen.queryByText('Choose between 0:30 and 10:00.')).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByText('Choose between 0:30 and 10:00.')).toBeInTheDocument();
    expect(start).toBeDisabled();

    await user.clear(timer);
    await user.type(timer, '20');
    await user.tab();
    expect(screen.getByText('Choose between 0:30 and 10:00.')).toBeInTheDocument();
    expect(start).toBeDisabled();

    await user.clear(timer);
    await user.type(timer, '245');
    await user.tab();
    expect(screen.queryByText('Choose between 0:30 and 10:00.')).not.toBeInTheDocument();
    expect(start).toBeEnabled();
  });

  it('rolls typed seconds over 59 into minutes when the box loses focus', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    const timer = screen.getByRole('textbox', { name: /Time limit/ });
    await user.clear(timer);
    await user.type(timer, '175');
    expect(timer).toHaveValue('1:75');
    await user.tab();
    expect(timer).toHaveValue('2:15');
  });

  it('picks the renamed level for a player who saved an old level name', () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulty: 'Master 2', categories: [], skips: 3 } });
    renderApp(<SetupScreen mode="classic" />);
    expect(screen.getByRole('radio', { name: /^Elite/ })).toBeChecked();
    // No time was saved, so the timer follows the renamed level's default (4:00).
    expect(screen.getByRole('textbox', { name: /Time limit 4:00/ })).toBeInTheDocument();
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
