import { z } from 'zod';
import {
  CATEGORY_IDS,
  CLOCK_KINDS,
  DIFFICULTY_IDS,
  FEEDBACK_ENTRY_POINTS,
  FEEDBACK_PLATFORMS,
  FEEDBACK_TOPIC_IDS,
  MODE_IDS,
  PLAY_KINDS,
  canSendFeedback,
  feedbackRules,
  type Card,
  type DealtDeck,
  type GameConfig,
} from '@unspoken/core';

// Every path carries the API version, so a breaking change ships as /v2 beside /v1. Multiplayer
// will add /v1/rooms.
export const paths = {
  config: '/v1/config',
  decks: '/v1/decks',
  feedback: '/v1/feedback',
} as const;

const difficulty = z.enum(DIFFICULTY_IDS);
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
      passAfterEveryWord: z.boolean(),
      available: z.boolean(),
    }),
  ),
  defaults: z.object({ mode, difficulty, categories: z.array(category), skips: whole.nullable() }),
  skipOptions: z.array(whole.nullable()),
  minRoundSeconds: whole,
  maxRoundSeconds: whole,
  smallDeckCards: whole,
  escalate: z.object({ start: whole, max: whole, winAtMax: whole, minFullCards: whole }),
  hotPotato: z.object({ maxFactor: z.number().positive() }),
  reverse: z.object({ firstClues: whole }),
  mindReader: z.object({ predictions: whole }),
}) satisfies z.ZodType<GameConfig>;

// POST /v1/decks: a shuffled deck for a difficulty and themes (none means All cards). The same seed
// always deals the same deck; without one the server picks a seed and returns it.
export const dealRequestSchema = z.object({
  difficulty,
  categories: z.array(category).default([]),
  mode: mode.optional(),
  count: z.number().int().min(1).max(1000).optional(),
  seed: z.number().int().min(0).max(0xffffffff).optional(),
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

// Every error response has this body. Codes: invalid_request (with issues), not_found, internal.
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), message: z.string() })).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
export type ApiIssue = NonNullable<ApiErrorBody['error']['issues']>[number];

// What a client needs from its environment. Apps read their own literal public env vars
// (EXPO_PUBLIC_*, NEXT_PUBLIC_*) and pass the values here; see docs/architecture.md.
export const clientConfigSchema = z.object({
  apiBaseUrl: z.url(),
  gaMeasurementId: z.string().regex(/^G-[A-Z0-9]+$/).optional(),
});
export type ClientConfig = z.infer<typeof clientConfigSchema>;
