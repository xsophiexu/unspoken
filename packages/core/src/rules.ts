import { gameConfig, type DifficultyRules, type GameConfig, type ModeRules } from './config';
import { format, plural, type Plural } from './text';
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

// Difficulties in catalog order (easiest first), each once, keeping only known ones.
export function sortDifficulties(list: readonly Difficulty[], config: GameConfig = gameConfig): Difficulty[] {
  return config.difficulties.map((d) => d.id).filter((id) => list.includes(id));
}

// The hardest of the picks. The default time limit, banned word count and Hot Potato's hidden
// clock follow it.
export function hardestDifficulty(list: readonly Difficulty[], config: GameConfig = gameConfig): Difficulty {
  const sorted = sortDifficulties(list, config);
  const hardest = sorted[sorted.length - 1];
  if (!hardest) throw new Error('No difficulty picked');
  return hardest;
}

// The easiest of the picks; the badge names it.
export function easiestDifficulty(list: readonly Difficulty[], config: GameConfig = gameConfig): Difficulty {
  const easiest = sortDifficulties(list, config)[0];
  if (!easiest) throw new Error('No difficulty picked');
  return easiest;
}

// Settings with new picks. A time limit still on the old hardest pick's default follows the new
// hardest pick; a typed time stays.
function withDifficulties(settings: GameSettings, picks: readonly Difficulty[], config: GameConfig): GameSettings {
  const difficulties = sortDifficulties(picks, config);
  const onDefault = settings.roundSeconds === defaultRoundSeconds(hardestDifficulty(settings.difficulties, config), config);
  const roundSeconds = onDefault ? defaultRoundSeconds(hardestDifficulty(difficulties, config), config) : settings.roundSeconds;
  return { ...settings, difficulties, roundSeconds };
}

// Settings with just this one difficulty (the in-game difficulty picker).
export function withDifficulty(settings: GameSettings, difficulty: Difficulty, config: GameConfig = gameConfig): GameSettings {
  return withDifficulties(settings, [difficulty], config);
}

// Setup's difficulty tiles: a tap adds or removes that difficulty. The last pick can't be removed.
export function toggleDifficulty(settings: GameSettings, difficulty: Difficulty, config: GameConfig = gameConfig): GameSettings {
  const picked = settings.difficulties.includes(difficulty);
  if (picked && settings.difficulties.length === 1) return settings;
  const next = picked ? settings.difficulties.filter((d) => d !== difficulty) : [...settings.difficulties, difficulty];
  return withDifficulties(settings, next, config);
}

// What the badge and other short labels call the picks: the name of a single pick, or the easiest
// pick followed by "+" (Hard, Tough and Expert read "HARD+"). `names` gives each difficulty's text
// (a name or a badge) and `mixed` the template for several, such as "{easiest}+". Never longer than
// config.badgeMaxChars.
export function difficultyLabel(
  list: readonly Difficulty[],
  copy: { names: Readonly<Record<Difficulty, string>>; mixed: string },
  config: GameConfig = gameConfig,
): string {
  const sorted = sortDifficulties(list, config);
  const easiest = copy.names[easiestDifficulty(sorted, config)];
  const text = sorted.length === 1 ? easiest : format(copy.mixed, { easiest });
  return text.slice(0, config.badgeMaxChars);
}

// Setup's theme chips: All cards (null) clears the chosen themes; any other theme toggles, and
// clearing the last one means All cards again. Themes stay in catalog order.
export function toggleCategory(categories: readonly Category[], category: Category | null, config: GameConfig = gameConfig): Category[] {
  if (category === null) return [];
  const next = categories.includes(category) ? categories.filter((c) => c !== category) : [...categories, category];
  return config.categories.filter((c) => next.includes(c));
}

// Whether every category in the bank is picked (double-tapping All cards picks them all).
export function allCategoriesPicked(categories: readonly Category[], available: readonly Category[]): boolean {
  return available.length > 0 && available.every((c) => categories.includes(c));
}

// The last tap on All cards, so the next one can tell a double-tap: when it happened and the
// categories picked before it.
export type AllCardsTap = { at: number; before: readonly Category[] } | null;

// A tap on the All cards chip at `now` (ms). A single tap means All cards (no categories). A second
// tap within `windowMs` is a double-tap: it picks every category, or, when every category was
// already picked before the first tap, goes back to All cards.
export function tapAllCards(
  categories: readonly Category[],
  last: AllCardsTap,
  now: number,
  available: readonly Category[],
  windowMs: number,
): { categories: Category[]; last: AllCardsTap } {
  if (last && now - last.at <= windowMs) {
    return { categories: allCategoriesPicked(last.before, available) ? [] : [...available], last: null };
  }
  return { categories: [], last: { at: now, before: categories } };
}

// What the Categories row calls the picks: All cards for none, the names of one or two, and
// "{n} categories" for more.
export function categoriesSummary(
  categories: readonly Category[],
  copy: { all: string; names: Readonly<Record<Category, string>>; many: Plural },
  config: GameConfig = gameConfig,
): string {
  if (categories.length === 0) return copy.all;
  if (categories.length > config.namedCategories) return plural(categories.length, copy.many);
  return categories.map((c) => copy.names[c]).join(', ');
}

// The settings a fresh install starts with.
export function defaultSettings(config: GameConfig = gameConfig): GameSettings {
  const { defaults } = config;
  const { difficulty, ...rest } = defaults;
  return { ...rest, difficulties: [difficulty], categories: [...defaults.categories], roundSeconds: defaultRoundSeconds(difficulty, config), noTimeLimit: false };
}

// Whether a time limit is one setup accepts (0:30 to 10:00).
export function isTimeLimitInRange(seconds: number, config: GameConfig = gameConfig): boolean {
  return seconds >= config.minRoundSeconds && seconds <= config.maxRoundSeconds;
}

// A time moved into the accepted range, for times saved under older limits.
export function clampTimeLimit(seconds: number, config: GameConfig = gameConfig): number {
  return Math.min(config.maxRoundSeconds, Math.max(config.minRoundSeconds, seconds));
}

// The time limit moved by whole steps of the changer's − and + (−1 is one step shorter), kept in
// the accepted range. A typed time outside it comes back to the nearest limit first.
export function stepTimeLimit(seconds: number, steps: number, config: GameConfig = gameConfig): number {
  return clampTimeLimit(clampTimeLimit(seconds, config) + steps * config.timeLimitStepSeconds, config);
}

// Whether two sets of settings play a different time limit: one has a clock and the other none, or
// both have one of different lengths. The Paused screen uses it to say a change starts next turn.
export function timeLimitDiffers(a: GameSettings, b: GameSettings, config: GameConfig = gameConfig): boolean {
  const timed = hasTimeLimit(a, config);
  if (timed !== hasTimeLimit(b, config)) return true;
  return timed && a.roundSeconds !== b.roundSeconds;
}

// Whether rounds with these settings run a visible countdown: the mode has one and No time limit is off.
export function hasTimeLimit(settings: GameSettings, config: GameConfig = gameConfig): boolean {
  return hasTimerSetting(settings.mode, config) && !settings.noTimeLimit;
}

// Whether settings can start a game: a visible timer needs a time limit in range, unless it is off.
export function canStart(settings: GameSettings, config: GameConfig = gameConfig): boolean {
  if (!modeRules(settings.mode, config).available) return false;
  if (!hasTimeLimit(settings, config)) return true;
  return isTimeLimitInRange(settings.roundSeconds, config);
}

// A level id from saved data: a current id, or an old name mapped to its level (Expert 1 → Hard).
// Anything else is undefined.
export function toDifficulty(value: unknown, config: GameConfig = gameConfig): Difficulty | undefined {
  if (typeof value !== 'string') return undefined;
  const id = Object.hasOwn(LEGACY_DIFFICULTIES, value) ? LEGACY_DIFFICULTIES[value as keyof typeof LEGACY_DIFFICULTIES] : value;
  return config.difficulties.find((d) => d.id === id)?.id;
}

// Picks from saved data or a request: a list of difficulties (old names map to their new ones,
// unknown ones drop out), or, from saves and clients before several could be picked, a single
// difficulty as a one-item list. Undefined when neither names a known difficulty.
export function parseDifficulties(
  value: { difficulties?: unknown; difficulty?: unknown },
  config: GameConfig = gameConfig,
): Difficulty[] | undefined {
  const raw = Array.isArray(value.difficulties) ? (value.difficulties as unknown[]) : [value.difficulty];
  const known = raw.map((d) => toDifficulty(d, config)).filter((d): d is Difficulty => d !== undefined);
  const sorted = sortDifficulties(known, config);
  return sorted.length > 0 ? sorted : undefined;
}

// Reads saved settings (from device storage or a request), keeping each valid field and defaulting
// the rest. A mode that is not available falls back to the default mode; an old level name maps to
// its level, and a single saved difficulty becomes a one-item list.
// A whole-second time saved under older, wider limits moves to the nearest limit (15:00 → 10:00).
export function parseSettings(value: unknown, config: GameConfig = gameConfig): GameSettings {
  const fallback = defaultSettings(config);
  const v = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof GameSettings | 'difficulty', unknown>>;
  const mode = config.modes.find((m) => m.id === v.mode && m.available)?.id ?? fallback.mode;
  const difficulties = parseDifficulties(v, config) ?? fallback.difficulties;
  const saved = Array.isArray(v.categories) ? (v.categories as unknown[]) : [];
  const categories = config.categories.filter((c) => saved.includes(c));
  const seconds = v.roundSeconds;
  const roundSeconds =
    typeof seconds === 'number' && Number.isInteger(seconds) && seconds > 0
      ? clampTimeLimit(seconds, config)
      : defaultRoundSeconds(hardestDifficulty(difficulties, config), config);
  const skips = config.skipOptions.find((n) => n === v.skips);
  // Settings saved before the switch existed have a time limit.
  const noTimeLimit = v.noTimeLimit === true;
  return { mode, difficulties, categories, roundSeconds, skips: skips === undefined ? fallback.skips : skips, noTimeLimit };
}
