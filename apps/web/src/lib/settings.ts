import { CATEGORY_IDS, DIFFICULTY_IDS, MODE_IDS, defaultRoundSeconds, defaultSettings, gameConfig, modeRules, type GameSettings } from '@unspoken/core';
import { z } from 'zod';

export const SETTINGS_STORAGE_KEY = 'unspoken.settings';

// Reads saved game settings, keeping each valid field and defaulting the rest (like
// parseThemeSelection does for the theme). A mode that is no longer available falls back too.
export function parseSettings(value: unknown, config = gameConfig): GameSettings {
  const fallback = defaultSettings(config);
  const schema = z.object({
    mode: z
      .enum(MODE_IDS)
      .refine((mode) => modeRules(mode, config).available)
      .catch(fallback.mode),
    difficulty: z.enum(DIFFICULTY_IDS).catch(fallback.difficulty),
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
