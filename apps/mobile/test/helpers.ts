import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSettings, type GameSettings } from '@unspoken/core';
import type { ThemeSelection } from '@unspoken/design-tokens';
import { renderRouter } from 'expo-router/testing-library';

import type { SavedPrefs } from '../src/state/storage';

const KEY = 'unspoken.prefs.v1';

// Start the real app (src/app) at a route, with these prefs already saved on the device and the
// How to play tour already seen.
export async function openApp(url: string, { theme, settings }: { theme?: Partial<ThemeSelection>; settings?: Partial<GameSettings> } = {}) {
  const prefs: SavedPrefs = {
    theme: { style: 'card', color: 'teal', mode: 'light', ...theme },
    settings: { ...parseSettings(null), ...settings },
    tourSeen: true,
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
