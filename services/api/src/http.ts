import type { HttpBindings } from '@hono/node-server';
import { apiErrorStatus, issuesOf, type ApiErrorBody, type ApiErrorCode, type ApiIssue } from '@unspoken/api-contract';
import type { Context, ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { validator } from 'hono/validator';
import type { z } from 'zod';

// Node's request and response, present when served by @hono/node-server (not in app.request tests).
export type AppEnv = { Bindings: Partial<HttpBindings> };

// Answer with the contract's error body and the status that goes with the code.
export function fail(c: Context, code: ApiErrorCode, message: string, issues?: ApiIssue[]) {
  const body: ApiErrorBody = { error: { code, message, ...(issues && { issues }) } };
  return c.json(body, apiErrorStatus[code]);
}

// Validate a JSON body with a contract schema; handlers read the parsed value with c.req.valid('json').
// A body sent without a JSON content type validates as {} and fails the schema.
export const validJson = <S extends z.ZodType>(schema: S) =>
  validator('json', (value, c): z.output<S> | Response => {
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : fail(c, 'invalid_request', 'The request is not valid', issuesOf(parsed.error));
  });

export const handleError: ErrorHandler<AppEnv> = (error, c) => {
  // Hono raises these for requests it can't read, such as malformed JSON.
  if (error instanceof HTTPException && error.status < 500) return fail(c, 'invalid_request', error.message);
  console.error(error);
  return fail(c, 'internal', 'Something went wrong');
};
