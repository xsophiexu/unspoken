import { gameConfig, type DifficultyRules, type GameConfig, type ModeRules } from './config';
import { LEGACY_DIFFICULTIES, type Category, type Difficulty, type GameSettings, type ModeId, type Random } from './types';

function difficultyRules(id: Difficulty, config: GameConfig = gameConfig): DifficultyRules {
  const found = config.difficulties.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown difficulty: ${id}`);
  return found;
}

export function modeRules(id: ModeId, config: GameConfig = gameConfig): ModeRules {
  const found = config.modes.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown mode: ${id}`);
  return found;
}

// Default round length for a level.
export function defaultRoundSeconds(difficulty: Difficulty, config: GameConfig = gameConfig): number {
  return difficultyRules(difficulty, config).roundSeconds;
}

// Banned words shown on each card at a level (Escalate overrides this as the round climbs).
export function bannedCountFor(difficulty: Difficulty, config: GameConfig = gameConfig): number {
  return difficultyRules(difficulty, config).bannedCount;
}

// Whether setup shows a round timer for the mode. Hot Potato's clock is hidden and random, so it has none to set.
export function hasTimerSetting(mode: ModeId, config: GameConfig = gameConfig): boolean {
  return modeRules(mode, config).clock === 'visible';
}

// Whether setup offers a skip limit for the mode.
export function hasSkipSetting(mode: ModeId, config: GameConfig = gameConfig): boolean {
  return modeRules(mode, config).skipLimit;
}

// Hot Potato's hidden round length range at a level, in whole seconds.
export function hotPotatoRange(difficulty: Difficulty, config: GameConfig = gameConfig): { min: number; max: number } {
  const min = difficultyRules(difficulty, config).hotPotatoMinSeconds;
  return { min, max: Math.round(min * config.hotPotato.maxFactor) };
}

// Picks Hot Potato's hidden round length: uniformly between the level's shortest round and the longest.
export function hiddenRoundSeconds(difficulty: Difficulty, random: Random, config: GameConfig = gameConfig): number {
  const { min, max } = hotPotatoRange(difficulty, config);
  return Math.round(min + random() * (max - min));
}

// Escalate's banned-word level after this many correct answers, and progress toward the win.
export function escalateProgress(correct: number, config: GameConfig = gameConfig) {
  const { start, max, winAtMax } = config.escalate;
  const level = Math.min(max, start + correct);
  // Correct answers made with every banned word showing.
  const atMax = Math.max(0, correct - (max - start));
  return { level, atMax, atTop: level >= max, won: atMax >= winAtMax };
}

// Settings for a new difficulty. A timer still on its level's default follows the new level;
// a typed time stays.
export function withDifficulty(settings: GameSettings, difficulty: Difficulty, config: GameConfig = gameConfig): GameSettings {
  const onDefault = settings.roundSeconds === defaultRoundSeconds(settings.difficulty, config);
  return { ...settings, difficulty, roundSeconds: onDefault ? defaultRoundSeconds(difficulty, config) : settings.roundSeconds };
}

// Setup's theme chips: All cards (null) clears the chosen themes; any other theme toggles, and
// clearing the last one means All cards again. Themes stay in catalog order.
export function toggleCategory(categories: readonly Category[], category: Category | null, config: GameConfig = gameConfig): Category[] {
  if (category === null) return [];
  const next = categories.includes(category) ? categories.filter((c) => c !== category) : [...categories, category];
  return config.categories.filter((c) => next.includes(c));
}

// The settings a fresh install starts with.
export function defaultSettings(config: GameConfig = gameConfig): GameSettings {
  const { defaults } = config;
  return { ...defaults, categories: [...defaults.categories], roundSeconds: defaultRoundSeconds(defaults.difficulty, config) };
}

// Whether settings can start a game: a visible timer needs at least the minimum round length.
export function canStart(settings: GameSettings, config: GameConfig = gameConfig): boolean {
  if (!modeRules(settings.mode, config).available) return false;
  if (!hasTimerSetting(settings.mode, config)) return true;
  return settings.roundSeconds >= config.minRoundSeconds && settings.roundSeconds <= config.maxRoundSeconds;
}

// A level id from saved data: a current id, or an old name mapped to its level (Expert 1 → Hard).
// Anything else is undefined.
export function toDifficulty(value: unknown, config: GameConfig = gameConfig): Difficulty | undefined {
  if (typeof value !== 'string') return undefined;
  const id = Object.hasOwn(LEGACY_DIFFICULTIES, value) ? LEGACY_DIFFICULTIES[value as keyof typeof LEGACY_DIFFICULTIES] : value;
  return config.difficulties.find((d) => d.id === id)?.id;
}

// Reads saved settings (from device storage or a request), keeping each valid field and defaulting
// the rest. A mode that is not available falls back to the default mode; an old level name maps to its level.
export function parseSettings(value: unknown, config: GameConfig = gameConfig): GameSettings {
  const fallback = defaultSettings(config);
  const v = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof GameSettings, unknown>>;
  const mode = config.modes.find((m) => m.id === v.mode && m.available)?.id ?? fallback.mode;
  const difficulty = toDifficulty(v.difficulty, config) ?? fallback.difficulty;
  const saved = Array.isArray(v.categories) ? (v.categories as unknown[]) : [];
  const categories = config.categories.filter((c) => saved.includes(c));
  const seconds = v.roundSeconds;
  const roundSeconds =
    typeof seconds === 'number' && Number.isInteger(seconds) && seconds >= config.minRoundSeconds && seconds <= config.maxRoundSeconds
      ? seconds
      : defaultRoundSeconds(difficulty, config);
  const skips = config.skipOptions.find((n) => n === v.skips);
  return { mode, difficulty, categories, roundSeconds, skips: skips === undefined ? fallback.skips : skips };
}
