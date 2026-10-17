import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '@unspoken/content';
import { parseSettings, type GameSettings } from '@unspoken/core';
import type { ThemeSelection } from '@unspoken/design-tokens';
import { renderRouter } from 'expo-router/testing-library';

import type { SavedPrefs } from '../src/state/storage';

const KEY = 'unspoken.prefs.v1';

// Start the real app (src/app) at a route, with these prefs already saved on the device and the
// How to play tour already seen (or, with `tour`, the raw tour fields an older or newer save had).
export async function openApp(
  url: string,
  {
    theme,
    settings,
    tour = { tourVersion: en.howToPlay.version },
  }: {
    theme?: Partial<ThemeSelection>;
    // Saved settings; a single `difficulty` saves them the way the app did before several could be picked.
    settings?: Partial<GameSettings> | (Omit<Partial<GameSettings>, 'difficulties'> & { difficulty: string });
    tour?: Record<string, unknown>;
  } = {},
) {
  const { difficulties, ...defaults } = parseSettings(null);
  const prefs = {
    theme: { style: 'card', color: 'teal', mode: 'light', ...theme },
    settings: { ...defaults, ...(settings && 'difficulty' in settings ? {} : { difficulties }), ...settings },
    ...tour,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  return renderRouter('./src/app', { initialUrl: url });
}

// What the app has saved on the device.
export async function savedPrefs(): Promise<SavedPrefs> {
  return JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
}

export async function resetDevice() {
  await AsyncStorage.clear();
}
