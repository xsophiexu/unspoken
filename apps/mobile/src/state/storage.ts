import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSettings, type GameSettings } from '@unspoken/core';
import { parseThemeSelection, type ThemeSelection } from '@unspoken/design-tokens';

// What the app keeps on the device: the look (style, color, light or dark), the game settings and
// whether the How to play tour has been seen. AsyncStorage uses localStorage on web.

export type SavedPrefs = {
  theme: ThemeSelection;
  settings: GameSettings;
  tourSeen: boolean;
};

const KEY = 'unspoken.prefs.v1';

export function parsePrefs(value: unknown): SavedPrefs {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof SavedPrefs, unknown>>;
  return { theme: parseThemeSelection(v.theme), settings: parseSettings(v.settings), tourSeen: v.tourSeen === true };
}

// The saved preferences, or null on a first launch (or when storage can't be read).
export async function loadPrefs(): Promise<SavedPrefs | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw === null ? null : parsePrefs(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function savePrefs(prefs: SavedPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Storage full or unavailable (private browsing): keep playing with what's in memory.
  }
}
