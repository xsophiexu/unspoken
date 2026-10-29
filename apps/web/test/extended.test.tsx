import { en, extendedBank } from '@unspoken/content';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { SetupScreen } from '@/screens/SetupScreen';
import { THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

// The website's extras: the Easy level and the seasonal categories (Halloween, Thanksgiving,
// Christmas).

const categoriesRow = () => screen.getByRole('button', { name: /^Categories:/ });
const halloweenWords = new Set(extendedBank.filter((c) => c.categories.includes('Halloween')).map((c) => c.word));
const easyWords = new Set(extendedBank.filter((c) => c.difficulty === 'Easy').map((c) => c.word));
const everyLevel = ['Easy', 'Normal', 'Tricky', 'Hard', 'Tough', 'Expert', 'Elite', 'Master', 'Legend'];

// Plays a Classic round with these picks, answering Correct, and returns the words it showed.
function playedWords(picks: { difficulties: string[]; categories: string[] }, count: number) {
  vi.useFakeTimers();
  saved({
    [TOUR_STORAGE_KEY]: en.howToPlay.version,
    [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' },
    [SETTINGS_STORAGE_KEY]: { mode: 'classic', skips: 3, noTimeLimit: true, ...picks },
  });
  renderApp(<PlayScreen />);
  const seen: string[] = [];
  for (let i = 0; i < count; i++) {
    seen.push(screen.getByRole('heading', { level: 1 }).textContent!);
    fireEvent.click(screen.getByRole('button', { name: en.play.correct }));
    act(() => vi.advanceTimersByTime(1000));
  }
  return seen;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Halloween', () => {
  it('appears in the Categories picker after the other categories, before Thanksgiving and Christmas', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    await user.click(categoriesRow());
    const chips = within(screen.getByRole('group', { name: en.categoriesSheet.title })).getAllByRole('checkbox');
    expect(chips.at(-5)).toHaveAccessibleName(/^Fantasy and Sci-Fi/);
    expect(chips.at(-4)).toHaveAccessibleName(/^Halloween/);
    expect(chips.at(-3)).toHaveAccessibleName(/^Thanksgiving/);
    expect(chips.at(-2)).toHaveAccessibleName(/^Christmas/);
    // The Hot Mic experiment's Medical pack comes last.
    expect(chips.at(-1)).toHaveAccessibleName(/^Medical/);
  });

  it('counts its cards on the difficulty tiles once picked, Easy included, and saves the pick', async () => {
    const user = userEvent.setup();
    renderApp(<SetupScreen mode="classic" />);
    await user.click(categoriesRow());
    await user.click(screen.getByRole('checkbox', { name: /^Halloween/ }));
    await user.click(screen.getByRole('button', { name: en.categoriesSheet.done }));

    expect(categoriesRow()).toHaveAccessibleName(/^Categories: Halloween\./);
    // 13 Halloween cards have score 1, so they sit at Easy.
    expect(screen.getByRole('checkbox', { name: /^Easy/ })).toHaveAccessibleName(/^Easy\s*13 cards$/);
    // 44 cards at Normal: few enough that Start asks first.
    await user.click(screen.getByRole('button', { name: en.setup.start }));
    await user.click(screen.getByRole('button', { name: en.smallDeck.playAnyway }));
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ categories: ['Halloween'] });
  });

  it('plays only Halloween cards, tagged free bank words included, when only Halloween is picked', () => {
    const seen = playedWords({ difficulties: everyLevel, categories: ['Halloween'] }, 40);
    expect(seen.filter((w) => !halloweenWords.has(w))).toEqual([]);
    expect(seen.some((w) => w === 'Witch' || w === 'Vampire' || w === 'Zombie' || w === 'Mummy' || w === 'Skeleton')).toBe(true);
  });

  it('keeps a saved Halloween pick after a reload', () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulties: ['Normal'], categories: ['Society', 'Halloween'], skips: 3 } });
    const { unmount } = renderApp(<SetupScreen mode="classic" />);
    expect(categoriesRow()).toHaveAccessibleName(/^Categories: Society, Halloween\./);
    unmount();
    renderApp(<SetupScreen mode="classic" />);
    expect(categoriesRow()).toHaveAccessibleName(/^Categories: Society, Halloween\./);
  });
});

describe.each([
  { category: 'Thanksgiving', tagged: ['Leftovers', 'Food coma', 'Black Friday', 'Potluck', 'Second helping'] },
  { category: 'Christmas', tagged: ['Elf', 'Mistletoe', 'Regift', 'Gift card'] },
])('$category', ({ category, tagged }) => {
  const inCategory = extendedBank.filter((c) => c.categories.includes(category as (typeof c.categories)[number]));

  it('plays every one of its cards, tagged free bank words included, and nothing else, when only it is picked', () => {
    const seen = playedWords({ difficulties: everyLevel, categories: [category] }, inCategory.length);
    expect([...seen].sort()).toEqual(inCategory.map((c) => c.word).sort());
    expect(tagged.filter((w) => !seen.includes(w))).toEqual([]);
  });
});

it('never plays Thanksgiving or Christmas pack cards in All cards', { timeout: 30_000 }, () => {
  // The pack's own cards: in no other category (a free bank card may already sit out of All cards).
  const holiday = (t: string) => t === 'Thanksgiving' || t === 'Christmas';
  const packOnly = new Set(extendedBank.filter((c) => c.categories.every(holiday)).map((c) => c.word));
  expect(packOnly.size).toBe(107);
  const seen = playedWords({ difficulties: everyLevel, categories: [] }, 200);
  expect(seen.filter((w) => packOnly.has(w))).toEqual([]);
});

describe('Easy', () => {
  it('is the first difficulty tile, and new players start at Normal', () => {
    renderApp(<SetupScreen mode="classic" />);
    const tiles = within(screen.getByRole('group', { name: en.setup.difficulty })).getAllByRole('checkbox');
    expect(tiles).toHaveLength(everyLevel.length);
    tiles.forEach((tile, i) => expect(tile).toHaveAccessibleName(new RegExp(`^${everyLevel[i]}\\s*[\\d,]+ cards$`)));
    expect(screen.getByRole('checkbox', { name: /^Normal/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^Easy/ })).not.toBeChecked();
  });

  it('plays only score 1 cards when only Easy is picked', () => {
    const seen = playedWords({ difficulties: ['Easy'], categories: [] }, 30);
    expect(seen.filter((w) => !easyWords.has(w))).toEqual([]);
    // The header names the level.
    expect(screen.getByRole('button', { name: 'Difficulty Easy. Tap to change.' })).toHaveTextContent('EASY');
  });

  it('is offered on the in-play difficulty picker', async () => {
    const user = userEvent.setup();
    saved({
      [TOUR_STORAGE_KEY]: en.howToPlay.version,
      [THEME_STORAGE_KEY]: { style: 'deck', color: 'teal', mode: 'light' },
      [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulties: ['Hard'], categories: [], skips: 3 },
    });
    renderApp(<PlayScreen />);
    await user.click(screen.getByRole('button', { name: 'Classic, Hard. Tap to change.' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Easy' }));
    expect(screen.getByRole('button', { name: 'Classic, Easy. Tap to change.' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ difficulties: ['Easy'] });
  });
});
