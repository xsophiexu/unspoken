import type { z } from 'zod';
import type { DealtDeck, GameConfig } from '@unspoken/core';
import {
  apiErrorSchema,
  dealRequestSchema,
  dealtDeckSchema,
  feedbackReceiptSchema,
  feedbackRequestSchema,
  gameConfigSchema,
  paths,
  type ApiIssue,
  type DealDeckRequest,
  type FeedbackReceipt,
  type FeedbackRequest,
} from './schemas';

// Every failure is an ApiError. status is 0 when no response arrived (network, or a request the
// client refused to send). code is the server's error code, or one of network, invalid_request,
// invalid_response and http_error.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues?: ApiIssue[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Zod issues in the shape error bodies carry them (the service sends invalid_request with these).
export const issuesOf = (error: z.ZodError): ApiIssue[] =>
  error.issues.map((i) => ({ path: i.path.map((p) => (typeof p === 'symbol' ? String(p) : p)), message: i.message }));

export type ApiClientOptions = {
  baseUrl: string;
  // Defaults to the global fetch; tests and servers can pass their own.
  fetch?: typeof fetch;
};

export type ApiClient = {
  getConfig(): Promise<GameConfig>;
  dealDeck(request: DealDeckRequest): Promise<DealtDeck>;
  sendFeedback(request: FeedbackRequest): Promise<FeedbackReceipt>;
};

export function createApiClient({ baseUrl, fetch: send = globalThis.fetch }: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  function validate<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new ApiError(0, 'invalid_request', 'The request is not valid', issuesOf(parsed.error));
    return parsed.data;
  }

  async function call<S extends z.ZodType>(path: string, schema: S, body?: unknown): Promise<z.output<S>> {
    const init: RequestInit =
      body === undefined
        ? { method: 'GET', headers: { accept: 'application/json' } }
        : { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify(body) };
    let response: Response;
    try {
      response = await send(root + path, init);
    } catch (cause) {
      throw new ApiError(0, 'network', cause instanceof Error ? cause.message : 'Network error');
    }
    const json: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const body = apiErrorSchema.safeParse(json);
      if (!body.success) throw new ApiError(response.status, 'http_error', `HTTP ${response.status}`);
      const { code, message, issues } = body.data.error;
      throw new ApiError(response.status, code, message, issues);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new ApiError(response.status, 'invalid_response', 'Unexpected response', issuesOf(parsed.error));
    return parsed.data;
  }

  return {
    getConfig: () => call(paths.config, gameConfigSchema),
    dealDeck: async (request) => call(paths.decks, dealtDeckSchema, validate(dealRequestSchema, request)),
    sendFeedback: async (request) => call(paths.feedback, feedbackReceiptSchema, validate(feedbackRequestSchema, request)),
  };
}
