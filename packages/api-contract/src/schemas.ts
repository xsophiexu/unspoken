import { z } from 'zod';
import {
  CATEGORY_IDS,
  CLOCK_KINDS,
  DIFFICULTY_IDS,
  FEEDBACK_ENTRY_POINTS,
  FEEDBACK_PLATFORMS,
  FEEDBACK_TOPIC_IDS,
  LEGACY_DIFFICULTIES,
  MODE_IDS,
  PLAY_KINDS,
  canSendFeedback,
  gameConfig,
  feedbackRules,
  type Card,
  type DealtDeck,
  type Difficulty,
  type GameConfig,
  type LegacyDifficulty,
} from '@unspoken/core';

// Every path carries the API version, so a breaking change ships as /v2 beside /v1. Multiplayer
// will add /v1/rooms.
export const paths = {
  config: '/v1/config',
  decks: '/v1/decks',
  feedback: '/v1/feedback',
} as const;

const difficulty = z.enum(DIFFICULTY_IDS);
// Requests from older clients may name a level by its old name (Expert 1); it maps to the new one (Hard).
const legacyNames = Object.keys(LEGACY_DIFFICULTIES) as [LegacyDifficulty, ...LegacyDifficulty[]];
const requestDifficulty = z.union([difficulty, z.enum(legacyNames).transform((name) => LEGACY_DIFFICULTIES[name])]);
const category = z.enum(CATEGORY_IDS);
const mode = z.enum(MODE_IDS);
const whole = z.number().int().nonnegative();

// GET /v1/config: the rules catalog (difficulties, themes, modes, defaults, timer and mode rules).
export const gameConfigSchema = z.object({
  difficulties: z.array(z.object({ id: difficulty, roundSeconds: whole, bannedCount: whole, hotPotatoMinSeconds: whole })),
  categories: z.array(category),
  modes: z.array(
    z.object({
      id: mode,
      play: z.enum(PLAY_KINDS),
      clock: z.enum(CLOCK_KINDS),
      scored: z.boolean(),
      skipLimit: z.boolean(),
      bonusSeconds: whole,
      escalates: z.boolean(),
      passAfterCorrect: z.boolean(),
      available: z.boolean(),
    }),
  ),
  defaults: z.object({ mode, difficulty, categories: z.array(category), skips: whole.nullable() }),
  skipOptions: z.array(whole.nullable()),
  minRoundSeconds: whole,
  maxRoundSeconds: whole,
  timeLimitStepSeconds: whole,
  smallDeckCards: whole,
  namedCategories: whole,
  badgeMaxChars: whole,
  escalate: z.object({ start: whole, max: whole, winAtMax: whole, minFullCards: whole }),
  hotPotato: z.object({ maxFactor: z.number().positive() }),
  reverse: z.object({ firstClues: whole }),
  mindReader: z.object({
    predictions: whole,
    minPlayers: whole,
    maxPlayers: whole,
    minPerTeam: whole,
    minTeams: whole,
    maxTeams: whole,
    rounds: z.object({ default: whole, min: whole, max: whole }),
    quickDifficulty: difficulty,
    scoring: z.object({ guess: whole, bonusEverySeconds: z.number().int().positive(), bonusPoints: whole, perPrediction: whole, notGuessed: whole }),
  }),
  // Servers from before Versus don't send it; clients then use their own.
  versus: z
    .object({
      lineup: z.object({ minPlayers: whole, maxPlayers: whole, minPerTeam: whole, minTeams: whole, maxTeams: whole }),
      rounds: z.object({ default: whole, min: whole, max: whole }),
      turnSeconds: whole,
      skips: z.object({ default: whole, min: whole, max: whole }),
      correctPoints: whole,
      individual: z.object({ clueGiverPoints: whole, guesserPoints: whole, bonus: z.object({ on: z.boolean(), points: whole, minPlayers: whole }) }),
      penalty: z.object({ on: z.boolean(), points: z.object({ default: whole, min: whole, max: whole }) }),
    })
    .default(gameConfig.versus),
}) satisfies z.ZodType<GameConfig>;

// POST /v1/decks: a shuffled deck for one or more difficulties and themes (none means All cards).
// Newer clients send `difficulties`; older ones send a single `difficulty`, which still works. The
// same seed always deals the same deck; without one the server picks a seed and returns it.
export const dealRequestSchema = z
  .object({
    difficulty: requestDifficulty.optional(),
    difficulties: z.array(requestDifficulty).min(1).optional(),
    categories: z.array(category).default([]),
    mode: mode.optional(),
    count: z.number().int().min(1).max(1000).optional(),
    seed: z.number().int().min(0).max(0xffffffff).optional(),
  })
  .refine((r) => r.difficulty !== undefined || r.difficulties !== undefined, { message: 'Name a difficulty', path: ['difficulty'] })
  // Both go out, so a server from before `difficulties` still deals from the first pick.
  .transform(({ difficulty, difficulties, ...rest }) => {
    const picks = difficulties ?? [difficulty as Difficulty];
    return { ...rest, difficulty: difficulty ?? (picks[0] as Difficulty), difficulties: picks };
  });
export type DealDeckRequest = z.input<typeof dealRequestSchema>;

const cardSchema = z.object({
  id: z.string(),
  word: z.string(),
  banned: z.array(z.string()),
  weight: z.number().positive().optional(),
}) satisfies z.ZodType<Card>;

export const dealtDeckSchema = z.object({ seed: whole, total: whole, cards: z.array(cardSchema) }) satisfies z.ZodType<DealtDeck>;

// POST /v1/feedback: an idea from Send feedback. The message is trimmed and must fit the box.
export const feedbackRequestSchema = z.object({
  topic: z.enum(FEEDBACK_TOPIC_IDS),
  message: z
    .string()
    .trim()
    .refine((m) => canSendFeedback(m), `Write 1 to ${feedbackRules.maxLength} characters`),
  entryPoint: z.enum(FEEDBACK_ENTRY_POINTS).optional(),
  platform: z.enum(FEEDBACK_PLATFORMS).optional(),
  appVersion: z.string().max(40).optional(),
});
export type FeedbackRequest = z.input<typeof feedbackRequestSchema>;

export const feedbackReceiptSchema = z.object({ id: z.string(), receivedAt: z.iso.datetime() });
export type FeedbackReceipt = z.infer<typeof feedbackReceiptSchema>;

// Every error response has this body. `code` is one of apiErrorStatus; invalid_request carries issues.
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), message: z.string() })).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
export type ApiIssue = NonNullable<ApiErrorBody['error']['issues']>[number];

// Error codes the service sends, with the HTTP status of each. Clients should treat an unknown code like internal.
export const apiErrorStatus = {
  invalid_request: 400,
  not_found: 404,
  payload_too_large: 413,
  rate_limited: 429,
  internal: 500,
  // A feature the server is not set up for, such as feedback without a database.
  unavailable: 503,
} as const;
export type ApiErrorCode = keyof typeof apiErrorStatus;

// What a client needs from its environment. Apps read their own literal public env vars
// (EXPO_PUBLIC_*, NEXT_PUBLIC_*) and pass the values here; see docs/architecture.md.
export const clientConfigSchema = z.object({
  apiBaseUrl: z.url(),
  gaMeasurementId: z.string().regex(/^G-[A-Z0-9]+$/).optional(),
});
export type ClientConfig = z.infer<typeof clientConfigSchema>;
