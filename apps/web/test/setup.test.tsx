import { bank, en } from '@unspoken/content';
import { categoriesInBank, defaultRoundSeconds, format, formatClock, plural } from '@unspoken/core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { SetupScreen } from '@/screens/SetupScreen';

import { renderApp, saved } from './app';

const copy = en.setup;
const categoriesRow = () => screen.getByRole('button', { name: /^Categories:/ });
const themes = categoriesInBank(bank);

describe('New game setup', () => {
  it('offers a timer and skips only where the mode has them', () => {
    const { unmount } = renderApp(<SetupScreen mode="classic" />);
    expect(screen.getByRole('textbox', { name: /Time limit 1:30/ })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: copy.skips })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /No time limit/ })).not.toBeChecked();
    unmount();

    renderApp(<SetupScreen mode="hotPotato" />);
    expect(screen.queryByRole('textbox', { name: /Time limit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /No time limit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: copy.skips })).not.toBeInTheDocument();
  });

  it('keeps All cards exclusive of picked categories', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="endless" />);
    await user.click(categoriesRow());
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
    expect(screen.getByRole('checkbox', { name: /^Elite/ })).toBeChecked();
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1);
    // No time was saved, so the timer follows the renamed level's default (4:00).
    expect(screen.getByRole('textbox', { name: /Time limit 4:00/ })).toBeInTheDocument();
  });

  it('starts the game it was set up for and opens Play', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(<SetupScreen mode="classic" />);
    await user.click(screen.getByRole('checkbox', { name: /^Elite/ }));
    await user.click(categoriesRow());
    await user.click(screen.getByRole('checkbox', { name: /^Society/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Everyday Life/ }));
    await user.click(screen.getByRole('button', { name: en.categoriesSheet.done }));
    await user.click(screen.getByRole('radio', { name: en.a11y.unlimitedSkips }));
    await user.click(screen.getByRole('button', { name: copy.start }));

    expect(router.push).toHaveBeenCalledWith('/');
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
      mode: 'classic',
      difficulties: ['Normal', 'Elite'],
      categories: ['Society', 'Everyday Life'],
      // The timer was on Normal's default, so it follows the hardest pick.
      roundSeconds: 240,
      skips: null,
      noTimeLimit: false,
    });
  });

  it('No limit greys out the box, keeps its time for later and saves the choice', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    const timer = screen.getByRole('textbox', { name: /Time limit/ });
    const start = screen.getByRole('button', { name: copy.start });
    await user.clear(timer);
    await user.type(timer, '1200');
    await user.tab();
    expect(start).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: /No time limit/ }));
    expect(timer).toBeDisabled();
    expect(timer).toHaveValue('12:00');
    expect(screen.getByText(copy.noClock)).toBeInTheDocument();
    expect(screen.queryByText('0:30 to 10:00')).not.toBeInTheDocument();
    expect(screen.queryByText('Choose between 0:30 and 10:00.')).not.toBeInTheDocument();
    expect(start).toBeEnabled();

    await user.click(screen.getByRole('switch', { name: /No time limit/ }));
    expect(timer).toBeEnabled();
    expect(timer).toHaveValue('12:00');
    expect(screen.queryByText(copy.noClock)).not.toBeInTheDocument();
    expect(start).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: /No time limit/ }));
    await user.click(start);
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ mode: 'classic', noTimeLimit: true, roundSeconds: 720 });
  });

  it('toggles difficulty tiles, never clears the last one and times the round by the hardest pick', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    const normal = screen.getByRole('checkbox', { name: /^Normal/ });
    expect(normal).toBeChecked();
    expect(screen.getByText(copy.difficultyHint)).toBeInTheDocument();

    await user.click(normal);
    expect(normal).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: /^Tough/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Tricky/ }));
    expect(screen.getByText(new RegExp(`^${plural(3, en.units.difficulties)} · `))).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: new RegExp(`Time limit ${formatClock(defaultRoundSeconds('Tough'))}`) })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /^Tough/ }));
    expect(screen.getByRole('textbox', { name: new RegExp(`Time limit ${formatClock(defaultRoundSeconds('Tricky'))}`) })).toBeInTheDocument();
  });

  it('shows the difficulty examples with the current picks highlighted', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    await user.click(screen.getByRole('checkbox', { name: /^Legend/ }));
    await user.click(screen.getByRole('button', { name: en.a11y.difficultyInfo }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText(en.difficultyInfo.body)).toBeInTheDocument();
    const rows = within(sheet).getAllByRole('row').slice(1);
    const picked = rows.filter((row) => row.getAttribute('aria-current')).map((row) => within(row).getAllByRole('rowheader')[0]!.textContent);
    expect(picked).toEqual(['Normal', 'Legend']);
    expect(within(rows[3]!).getByText(en.difficultyInfo.examples[0]!.words.Hard)).toBeInTheDocument();
    expect(within(rows[0]!).getByText(en.difficultyInfo.examples[0]!.words.Easy)).toBeInTheDocument();
  });

  it('double-tapping All cards highlights every category, and again goes back to All cards', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    await user.click(categoriesRow());
    const all = screen.getByRole('checkbox', { name: new RegExp(`^${en.themes.all}`) });

    await user.dblClick(all);
    expect(themes.every((t) => screen.getByRole('checkbox', { name: new RegExp(`^${t}`) }).matches(':checked'))).toBe(true);
    expect(all).not.toBeChecked();
    expect(screen.getByText(en.categoriesSheet.hintAll)).toBeInTheDocument();

    await user.dblClick(all);
    expect(all).toBeChecked();
    expect(themes.some((t) => screen.getByRole('checkbox', { name: new RegExp(`^${t}`) }).matches(':checked'))).toBe(false);

    await user.click(screen.getByRole('button', { name: en.categoriesSheet.done }));
    expect(categoriesRow()).toHaveAccessibleName(format(en.a11y.categories, { summary: en.themes.all }));
  });

  it('asks before starting with few cards: Go back stays, Play anyway starts', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(<SetupScreen mode="classic" />);
    await user.click(categoriesRow());
    await user.click(screen.getByRole('checkbox', { name: /^Inner World/ }));
    await user.click(screen.getByRole('button', { name: en.categoriesSheet.done }));

    await user.click(screen.getByRole('button', { name: copy.start }));
    expect(within(screen.getByRole('dialog')).getByText(en.smallDeck.body)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: en.smallDeck.back }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: copy.start }));
    await user.click(screen.getByRole('button', { name: en.smallDeck.playAnyway }));
    expect(router.push).toHaveBeenCalledWith('/');
  });
});
