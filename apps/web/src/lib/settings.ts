import {
  ALL_MODE_IDS,
  clampTimeLimit,
  defaultRoundSeconds,
  defaultSettings,
  hardestDifficulty,
  parseDifficulties,
  parseSettings as parseCoreSettings,
  type Category,
  type GameSettings,
} from '@unspoken/core';
import { z } from 'zod';

import { catalogs, config as webConfig } from './catalog';

// Each edition saves its settings apart, so switching editions keeps both.
export const SETTINGS_STORAGE_KEY = catalogs.unspoken.settingsKey;
export const MD_SETTINGS_STORAGE_KEY = catalogs.md.settingsKey;

// Reads saved game settings, keeping each valid field and defaulting the rest (like
// parseThemeSelection does for the theme). A mode that is no longer available falls back too, an
// old level name maps to its level (Expert 1 → Hard), and a single saved difficulty becomes a
// one-item list. Categories the website doesn't offer drop out, keeping the rest. UnspokenMD's
// settings also keep their specialties and Zen's optional rules.
export function parseSettings(value: unknown, config = webConfig): GameSettings {
  const fallback = defaultSettings(config);
  const schema = z.object({
    mode: z
      .enum(ALL_MODE_IDS)
      .refine((mode) => config.modes.some((m) => m.id === mode && m.available))
      .catch(fallback.mode),
    categories: z
      .array(z.unknown())
      .transform((saved) => config.categories.filter((c) => saved.includes(c)))
      .catch([...fallback.categories]),
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
    // Settings saved before the switch existed have a time limit (unless the config starts without one).
    noTimeLimit: z.boolean().catch(fallback.noTimeLimit),
  });
  const raw = typeof value === 'object' && value !== null ? value : {};
  const parsed = schema.parse(raw);
  // A list of picks, or a single difficulty saved before several could be picked.
  const difficulties = parseDifficulties(raw, config) ?? fallback.difficulties;
  // A missing or bad timer follows the hardest pick's default.
  const settings: GameSettings = { ...parsed, difficulties, roundSeconds: parsed.roundSeconds ?? defaultRoundSeconds(hardestDifficulty(difficulties, config), config) };
  // Specialties and Zen's rules, read as core reads them (each valid field kept, the rest defaulted).
  if (config.specialties || config.zen) {
    const { specialties, noSkipLimit, scoreTarget, noScoreTarget } = parseCoreSettings(raw, config);
    Object.assign(settings, { specialties, noSkipLimit, scoreTarget, noScoreTarget });
  }
  return settings;
}

// Setup's theme chips: All cards (null) clears the chosen themes; a theme toggles, and clearing the
// last one means All cards again. Themes stay in catalog order.
export function toggleCategory(categories: readonly Category[], category: Category | null, config = webConfig): Category[] {
  if (category === null) return [];
  const next = categories.includes(category) ? categories.filter((c) => c !== category) : [...categories, category];
  return config.categories.filter((c) => next.includes(c));
}
