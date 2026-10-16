import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSettings, type GameSettings } from '@unspoken/core';
import { parseThemeSelection, type ThemeSelection } from '@unspoken/design-tokens';

// What the app keeps on the device: the look (style, color, light or dark), the game settings and
// which version of the How to play tour was last seen (0 for none). AsyncStorage uses localStorage
// on web.

export type SavedPrefs = {
  theme: ThemeSelection;
  settings: GameSettings;
  tourVersion: number;
};

const KEY = 'unspoken.prefs.v1';

export function parsePrefs(value: unknown): SavedPrefs {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof SavedPrefs | 'tourSeen', unknown>>;
  // Saves from before the tour had versions say only tourSeen: true, which was version 1.
  const tourVersion = typeof v.tourVersion === 'number' ? v.tourVersion : v.tourSeen === true ? 1 : 0;
  return { theme: parseThemeSelection(v.theme), settings: parseSettings(v.settings), tourVersion };
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
