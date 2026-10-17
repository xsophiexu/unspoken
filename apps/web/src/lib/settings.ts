import { CATEGORY_IDS, MODE_IDS, defaultRoundSeconds, defaultSettings, gameConfig, modeRules, toDifficulty, type Category, type GameSettings } from '@unspoken/core';
import { z } from 'zod';

export const SETTINGS_STORAGE_KEY = 'unspoken.settings';

// Reads saved game settings, keeping each valid field and defaulting the rest (like
// parseThemeSelection does for the theme). A mode that is no longer available falls back too, and an
// old level name maps to its level (Expert 1 → Hard).
export function parseSettings(value: unknown, config = gameConfig): GameSettings {
  const fallback = defaultSettings(config);
  const schema = z.object({
    mode: z
      .enum(MODE_IDS)
      .refine((mode) => modeRules(mode, config).available)
      .catch(fallback.mode),
    difficulty: z.unknown().optional().transform((value) => toDifficulty(value, config) ?? fallback.difficulty),
    categories: z.array(z.enum(CATEGORY_IDS)).catch([...fallback.categories]),
    roundSeconds: z.number().int().min(config.minRoundSeconds).max(config.maxRoundSeconds).optional().catch(undefined),
    skips: z
      .number()
      .int()
      .nullable()
      .refine((skips) => config.skipOptions.includes(skips))
      .catch(fallback.skips),
  });
  const parsed = schema.parse(typeof value === 'object' && value !== null ? value : {});
  // A missing or bad timer follows the saved level's default.
  return { ...parsed, roundSeconds: parsed.roundSeconds ?? defaultRoundSeconds(parsed.difficulty, config) };
}

// Setup's theme chips: All cards (null) clears the chosen themes; a theme toggles, and clearing the
// last one means All cards again. Themes stay in catalog order.
export function toggleCategory(categories: readonly Category[], category: Category | null, config = gameConfig): Category[] {
  if (category === null) return [];
  const next = categories.includes(category) ? categories.filter((c) => c !== category) : [...categories, category];
  return config.categories.filter((c) => next.includes(c));
}
