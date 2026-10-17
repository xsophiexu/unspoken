import {
  CATEGORY_IDS,
  MODE_IDS,
  clampTimeLimit,
  defaultRoundSeconds,
  defaultSettings,
  gameConfig,
  hardestDifficulty,
  modeRules,
  parseDifficulties,
  type Category,
  type GameSettings,
} from '@unspoken/core';
import { z } from 'zod';

export const SETTINGS_STORAGE_KEY = 'unspoken.settings';

// Reads saved game settings, keeping each valid field and defaulting the rest (like
// parseThemeSelection does for the theme). A mode that is no longer available falls back too, an
// old level name maps to its level (Expert 1 → Hard), and a single saved difficulty becomes a
// one-item list.
export function parseSettings(value: unknown, config = gameConfig): GameSettings {
  const fallback = defaultSettings(config);
  const schema = z.object({
    mode: z
      .enum(MODE_IDS)
      .refine((mode) => modeRules(mode, config).available)
      .catch(fallback.mode),
    categories: z.array(z.enum(CATEGORY_IDS)).catch([...fallback.categories]),
    // A time saved under older, wider limits moves to the nearest limit (15:00 → 10:00).
    roundSeconds: z
      .number()
      .int()
      .positive()
      .transform((seconds) => clampTimeLimit(seconds, config))
      .optional()
      .catch(undefined),
    skips: z
      .number()
      .int()
      .nullable()
      .refine((skips) => config.skipOptions.includes(skips))
      .catch(fallback.skips),
    // Settings saved before the switch existed have a time limit.
    noTimeLimit: z.boolean().catch(false),
  });
  const raw = typeof value === 'object' && value !== null ? value : {};
  const parsed = schema.parse(raw);
  // A list of picks, or a single difficulty saved before several could be picked.
  const difficulties = parseDifficulties(raw, config) ?? fallback.difficulties;
  // A missing or bad timer follows the hardest pick's default.
  return { ...parsed, difficulties, roundSeconds: parsed.roundSeconds ?? defaultRoundSeconds(hardestDifficulty(difficulties, config), config) };
}

// Setup's theme chips: All cards (null) clears the chosen themes; a theme toggles, and clearing the
// last one means All cards again. Themes stay in catalog order.
export function toggleCategory(categories: readonly Category[], category: Category | null, config = gameConfig): Category[] {
  if (category === null) return [];
  const next = categories.includes(category) ? categories.filter((c) => c !== category) : [...categories, category];
  return config.categories.filter((c) => next.includes(c));
}
