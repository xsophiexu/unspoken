// Home's ways into a game that skip New game: Quick Play (all cards, Normal to Hard) and Deep dive
// (one specialty or category at every difficulty). Both play the edition's default mode: Zen in
// UnspokenMD, Endless in Unspoken.

import { gameConfig, type GameConfig } from './config';
import { defaultSettings, difficultyLabel, sortDifficulties, withDifficulty } from './rules';
import { format } from './text';
import type { Category, Difficulty, GameSettings, Specialty } from './types';

// Quick Play's difficulties, whatever was played last.
export const QUICK_PLAY_DIFFICULTIES: readonly Difficulty[] = ['Normal', 'Tricky', 'Hard'];

// The edition's default settings with these picks and nothing else carried over: no categories, no
// specialties, the time limit on the hardest pick's default.
function freshSettings(config: GameConfig, difficulties: readonly Difficulty[], picks: Pick<GameSettings, 'categories' | 'specialties'>): GameSettings {
  const base = defaultSettings(config);
  const sorted = sortDifficulties(difficulties, config);
  const [first] = sorted;
  if (!first) throw new Error('No difficulty to play');
  // withDifficulty sets the time limit to the hardest pick's default; the list then takes every pick.
  const hardest = sorted[sorted.length - 1] as Difficulty;
  const settings = { ...withDifficulty(base, hardest, config), difficulties: sorted, categories: picks.categories };
  if (config.specialties) settings.specialties = picks.specialties ?? [];
  return settings;
}

// What Home's Quick Play starts: the default mode with all cards at QUICK_PLAY_DIFFICULTIES (the
// ones the edition has).
export function homeQuickPlaySettings(config: GameConfig = gameConfig): GameSettings {
  return freshSettings(config, QUICK_PLAY_DIFFICULTIES, { categories: [], specialties: [] });
}

// Whether a game plays exactly what Quick Play starts (same mode, difficulties and word bank), so
// Home's Quick Play can carry on with it.
export function isHomeQuickPlay(settings: GameSettings, config: GameConfig = gameConfig): boolean {
  const quick = homeQuickPlaySettings(config);
  const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));
  return (
    settings.mode === quick.mode &&
    same(sortDifficulties(settings.difficulties, config), quick.difficulties) &&
    settings.categories.length === 0 &&
    (settings.specialties ?? []).length === 0 &&
    !settings.easiestFirst
  );
}

// Deep dive's difficulties: every one the edition has (Normal to Legend in UnspokenMD, Easy to
// Legend in Unspoken).
export function deepDiveDifficulties(config: GameConfig = gameConfig): Difficulty[] {
  return config.difficulties.map((d) => d.id);
}

// The one thing a Deep dive draws from: a specialty in UnspokenMD, a category otherwise.
export type DeepDivePick = Specialty | Category;

// What a Deep dive starts: the default mode with one specialty (UnspokenMD) or category, at every
// difficulty, dealt easiest first or all shuffled together.
export function deepDiveSettings(pick: DeepDivePick, easiestFirst: boolean, config: GameConfig = gameConfig): GameSettings {
  const picks = config.specialties ? { categories: [], specialties: [pick as Specialty] } : { categories: [pick as Category] };
  return { ...freshSettings(config, deepDiveDifficulties(config), picks), easiestFirst };
}

// The one specialty or category these settings draw from, or undefined when they draw from none or
// several.
export function singlePick(settings: GameSettings, config: GameConfig = gameConfig): DeepDivePick | undefined {
  const picks: readonly DeepDivePick[] = config.specialties ? (settings.specialties ?? []) : settings.categories;
  return picks.length === 1 ? picks[0] : undefined;
}

// Several difficulties as a span from the easiest to the hardest ("Normal to Legend", or the chip's
// "NORMAL–HARD") when they run on without a gap; one difficulty by its name. A span with a gap, or
// one longer than maxChars, falls back to difficultyLabel ("NORMAL+"). `names` gives each
// difficulty's text (a name or a badge), `span` the template ("{easiest}–{hardest}") and `mixed`
// difficultyLabel's.
export function difficultySpan(
  list: readonly Difficulty[],
  copy: { names: Readonly<Record<Difficulty, string>>; span: string; mixed: string },
  config: GameConfig = gameConfig,
  maxChars = Infinity,
): string {
  const sorted = sortDifficulties(list, config);
  const ids = config.difficulties.map((d) => d.id);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === undefined || last === undefined || sorted.length === 1) return difficultyLabel(sorted, copy, { ...config, badgeMaxChars: maxChars });
  const unbroken = ids.indexOf(last) - ids.indexOf(first) === sorted.length - 1;
  const text = format(copy.span, { easiest: copy.names[first], hardest: copy.names[last] });
  return unbroken && text.length <= maxChars ? text : difficultyLabel(sorted, copy, { ...config, badgeMaxChars: maxChars });
}
