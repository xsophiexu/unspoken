import { bank, en } from '@unspoken/content';
import { categoriesInBank, defaultRoundSeconds, format, formatClock, plural, type GameSettings } from '@unspoken/core';
import { motion } from '@unspoken/design-tokens';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';

import { openApp, resetDevice, savedPrefs } from './helpers';

beforeEach(async () => {
  jest.useFakeTimers();
  await resetDevice();
});
afterEach(() => {
  jest.useRealTimers();
});

const tile = (name: string) => screen.getByRole('checkbox', { name: new RegExp(`^${name},`) });
const checked = (name: string) => tile(name).props.accessibilityState?.checked;
const categoriesRow = () => screen.getByRole('button', { name: /^Categories:/ });

async function openSetup(settings: Partial<GameSettings> = {}) {
  await openApp('/setup?mode=classic', { settings: { mode: 'classic', ...settings } });
  await screen.findByText(en.setup.title);
}

describe('New game difficulties', () => {
  it('toggles each tile, keeps at least one and starts with every pick', async () => {
    await openSetup({ difficulties: ['Normal'] });
    expect(screen.getByText(en.setup.difficultyHint)).toBeOnTheScreen();

    fireEvent.press(tile('Hard'));
    fireEvent.press(tile('Tough'));
    expect([checked('Normal'), checked('Hard'), checked('Tough'), checked('Tricky')]).toEqual([true, true, true, false]);
    expect(screen.getByText(new RegExp(`^${plural(3, en.units.difficulties)} · `))).toBeOnTheScreen();

    fireEvent.press(tile('Normal'));
    fireEvent.press(tile('Hard'));
    // The last pick stays.
    fireEvent.press(tile('Tough'));
    expect(checked('Tough')).toBe(true);

    fireEvent.press(tile('Hard'));
    fireEvent.press(screen.getByText(en.setup.start));
    await waitFor(async () => expect((await savedPrefs()).settings.difficulties).toEqual(['Hard', 'Tough']));
  });

  it('sets the time limit by the hardest pick until a time is typed', async () => {
    await openSetup({ difficulties: ['Normal'], roundSeconds: defaultRoundSeconds('Normal') });
    fireEvent.press(tile('Expert'));
    expect(screen.getByText(formatClock(defaultRoundSeconds('Expert')))).toBeOnTheScreen();
    fireEvent.press(tile('Tricky'));
    expect(screen.getByText(formatClock(defaultRoundSeconds('Expert')))).toBeOnTheScreen();
    fireEvent.press(tile('Expert'));
    expect(screen.getByText(formatClock(defaultRoundSeconds('Tricky')))).toBeOnTheScreen();
  });

  it('opens the info sheet with the examples and the picks highlighted', async () => {
    await openSetup({ difficulties: ['Hard', 'Legend'] });
    fireEvent.press(screen.getByLabelText(en.a11y.difficultyInfo));
    expect(await screen.findByText(en.difficultyInfo.body)).toBeOnTheScreen();
    const rows = en.difficultyInfo.examples.map((e) => e.words);
    const selected = (['Normal', 'Hard', 'Legend'] as const).map(
      (d) => screen.getByLabelText([en.difficulties[d].name, ...rows.map((w) => w[d])].join(', ')).props.accessibilityState.selected,
    );
    expect(selected).toEqual([false, true, true]);
  });
});

describe('Choose categories', () => {
  const available = categoriesInBank(bank);

  it('picks categories, with All cards clearing them, and shows the picks on New game', async () => {
    await openSetup();
    expect(categoriesRow()).toHaveAccessibleName(format(en.a11y.categories, { summary: en.themes.all }));
    fireEvent.press(categoriesRow());
    expect(await screen.findByText(en.categoriesSheet.title)).toBeOnTheScreen();
    expect(screen.getByText(en.categoriesSheet.hint)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('checkbox', { name: /^Pop Culture,/ }));
    fireEvent.press(screen.getByRole('checkbox', { name: /^Science and Nature,/ }));
    fireEvent.press(screen.getByText(en.categoriesSheet.done));
    expect(categoriesRow()).toHaveAccessibleName(format(en.a11y.categories, { summary: 'Pop Culture, Science and Nature' }));
  });

  it('double-tapping All cards highlights every category, and again goes back to All cards', async () => {
    await openSetup();
    fireEvent.press(categoriesRow());
    const allCards = await screen.findByRole('radio', { name: new RegExp(`^${en.themes.all},`) });

    fireEvent.press(allCards);
    fireEvent.press(allCards);
    const boxes = screen.getAllByRole('checkbox', { name: new RegExp(available.map((c) => `^${c},`).join('|')) });
    expect(boxes.filter((b) => b.props.accessibilityState.checked)).toHaveLength(available.length);
    expect(screen.getByText(en.categoriesSheet.hintAll)).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(motion.doubleTapMs + 1);
    });
    fireEvent.press(allCards);
    fireEvent.press(allCards);
    expect(screen.getAllByRole('checkbox').filter((b) => b.props.accessibilityState.checked && b.props.accessibilityLabel?.includes(available[0]))).toHaveLength(0);
    expect(allCards.props.accessibilityState.selected).toBe(true);
  });
});

describe('Start game with few cards', () => {
  it('asks first; Go back stays on New game and Play anyway starts', async () => {
    // Normal with only Inner World draws from fewer cards than the threshold.
    await openSetup({ difficulties: ['Normal'], categories: ['Inner World'] });
    fireEvent.press(screen.getByText(en.setup.start));
    const prompt = await screen.findByText(en.smallDeck.body);
    expect(prompt).toBeOnTheScreen();

    fireEvent.press(screen.getByText(en.smallDeck.back));
    await act(async () => {
      jest.advanceTimersByTime(motion.duration.slow);
    });
    expect(screen.queryByText(en.smallDeck.body)).not.toBeOnTheScreen();
    expect(screen.getByText(en.setup.title)).toBeOnTheScreen();

    fireEvent.press(screen.getByText(en.setup.start));
    fireEvent.press(await screen.findByText(en.smallDeck.playAnyway));
    await waitFor(async () => expect((await savedPrefs()).settings.categories).toEqual(['Inner World']));
  });

  it('starts straight away with enough cards', async () => {
    // Saved on Endless; starting from Classic's New game saves Classic.
    await openSetup({ mode: 'endless', difficulties: ['Normal'], categories: [] });
    fireEvent.press(screen.getByText(en.setup.start));
    expect(screen.queryByText(en.smallDeck.body)).not.toBeOnTheScreen();
    await waitFor(async () => expect((await savedPrefs()).settings.mode).toBe('classic'));
  });
});
