import { describe, expect, it } from 'vitest';

import { FeedbackError, SERVER_TIME, createFeedbackClient } from '../src';

import { fakeAdapter, sdkError } from './fakeAdapter';

const idea = { topic: 'modes', message: '  A team mode  ', entryPoint: 'modes', platform: 'web', appVersion: '1.0.0' } as const;

async function failure(promise: Promise<unknown>): Promise<FeedbackError> {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  if (!(error instanceof FeedbackError)) throw new Error(`Expected a FeedbackError, got ${String(error)}`);
  return error;
}

describe('sendFeedback', () => {
  it('signs in anonymously, then adds the trimmed idea and stamps the sender in one batch', async () => {
    const { adapter, state } = fakeAdapter();
    await createFeedbackClient(adapter).sendFeedback(idea);

    expect(state.signIns).toBe(1);
    expect(state.batches).toEqual([
      [
        {
          kind: 'add',
          collection: 'feedback',
          data: { topic: 'modes', message: 'A team mode', entryPoint: 'modes', platform: 'web', appVersion: '1.0.0', uid: 'anon-1', receivedAt: SERVER_TIME },
        },
        { kind: 'set', path: 'feedbackLimits/anon-1', data: { last: SERVER_TIME } },
      ],
    ]);
  });

  it('reuses the signed-in user', async () => {
    const { adapter, state } = fakeAdapter({ uid: 'player-7' });
    await createFeedbackClient(adapter).sendFeedback(idea);
    expect(state.signIns).toBe(0);
    expect(state.batches[0]?.[1]).toEqual({ kind: 'set', path: 'feedbackLimits/player-7', data: { last: SERVER_TIME } });
  });

  it('stores null for a missing entry point and app version', async () => {
    const { adapter, state } = fakeAdapter();
    await createFeedbackClient(adapter).sendFeedback({ topic: 'other', message: 'Hi', platform: 'android' });
    expect(state.batches[0]?.[0]?.data).toMatchObject({ entryPoint: null, appVersion: null, platform: 'android' });
  });

  it('leaves out an app version too long for the rules instead of dropping the idea', async () => {
    const { adapter, state } = fakeAdapter();
    await createFeedbackClient(adapter).sendFeedback({ ...idea, appVersion: '1.0.0-'.padEnd(33, 'x') });
    expect(state.batches[0]?.[0]?.data).toMatchObject({ appVersion: null, message: 'A team mode' });
  });

  it.each([
    ['only spaces', { message: '   ' }],
    ['over 500 characters', { message: 'x'.repeat(501) }],
    ['an unknown topic', { topic: 'colours' }],
    ['an unknown entry point', { entryPoint: 'settings' }],
    ['an unknown platform', { platform: 'desktop' }],
  ])('refuses %s without signing in or writing', async (_, change) => {
    const { adapter, state } = fakeAdapter();
    const error = await failure(createFeedbackClient(adapter).sendFeedback({ ...idea, ...change } as never));
    expect(error.code).toBe('invalid');
    expect(state.signIns).toBe(0);
    expect(state.batches).toEqual([]);
  });

  it('reports a rules rejection (permission-denied) as rate limited', async () => {
    const { adapter } = fakeAdapter({ commitError: sdkError('permission-denied') });
    expect((await failure(createFeedbackClient(adapter).sendFeedback(idea))).code).toBe('rateLimited');
  });

  it('reports other commit errors as failed', async () => {
    const { adapter } = fakeAdapter({ commitError: sdkError('unavailable') });
    expect((await failure(createFeedbackClient(adapter).sendFeedback(idea))).code).toBe('failed');
  });

  it('reports a failed sign-in as failed and writes nothing', async () => {
    const { adapter, state } = fakeAdapter({ signInError: sdkError('auth/network-request-failed') });
    expect((await failure(createFeedbackClient(adapter).sendFeedback(idea))).code).toBe('failed');
    expect(state.batches).toEqual([]);
  });
});
