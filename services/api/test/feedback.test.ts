import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { migrate } from '../src/db';
import { failure, testApp, testDatabase, unreachableDatabase } from './fixtures';

const now = new Date('2026-10-16T09:30:00.000Z');
const idea = { topic: 'styles', message: '  More dark styles, please  ', entryPoint: 'customize', platform: 'ios', appVersion: '2.0.0' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let database: Awaited<ReturnType<typeof testDatabase>>;
beforeAll(async () => {
  database = await testDatabase();
}, 30_000);
afterAll(() => database.db.close());

beforeEach(async () => {
  await database.empty();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

describe('POST /v1/feedback', () => {
  it('stores the trimmed idea, where it came from and when, and answers with its id', async () => {
    const { post } = testApp({}, { db: database.db });

    const response = await post('/v1/feedback', idea);

    expect(response.status).toBe(201);
    const receipt = (await response.json()) as { id: string };
    expect(receipt).toEqual({ id: expect.stringMatching(uuid), receivedAt: '2026-10-16T09:30:00.000Z' });
    expect(await database.storedFeedback()).toStrictEqual([
      { id: receipt.id, topic: 'styles', message: 'More dark styles, please', entry_point: 'customize', platform: 'ios', app_version: '2.0.0', received_at: now },
    ]);
  });

  it('stores the optional fields left out as null', async () => {
    const { api } = testApp({}, { db: database.db });

    await expect(api.sendFeedback({ topic: 'words', message: 'More food words' })).resolves.toEqual({ id: expect.stringMatching(uuid), receivedAt: now.toISOString() });
    expect(await database.storedFeedback()).toMatchObject([{ topic: 'words', message: 'More food words', entry_point: null, platform: null, app_version: null }]);
  });

  it.each([
    [{ topic: 'other', message: 'x'.repeat(501) }, ['message']],
    [{ topic: 'other', message: '   ' }, ['message']],
    [{ topic: 'praise', message: 'Love it' }, ['topic']],
    [{ topic: 'other', message: 'Hi', platform: 'windows' }, ['platform']],
    [{ topic: 'other', message: 'Hi', appVersion: '1'.repeat(41) }, ['appVersion']],
  ])('rejects %j at %j and stores nothing', async (body, path) => {
    const { post } = testApp({}, { db: database.db });

    expect(await failure(await post('/v1/feedback', body))).toEqual({ status: 400, code: 'invalid_request', paths: [path] });
    expect(await database.storedFeedback()).toEqual([]);
  });

  it('accepts 500 characters counted as the player sees them, and stores them intact', async () => {
    const { post } = testApp({}, { db: database.db });

    expect((await post('/v1/feedback', { topic: 'other', message: '😀'.repeat(500) })).status).toBe(201);
    expect(await database.storedFeedback()).toMatchObject([{ message: '😀'.repeat(500) }]);
  });

  it('keeps what was stored when the service restarts and migrates again', async () => {
    const { post } = testApp({}, { db: database.db });
    expect((await post('/v1/feedback', idea)).status).toBe(201);

    await migrate(database.db);

    expect((await testApp({}, { db: database.db }).post('/v1/feedback', idea)).status).toBe(201);
    expect(await database.storedFeedback()).toHaveLength(2);
  });

  it('answers 503 unavailable without a database while decks still deal', async () => {
    const { api, post } = testApp();

    expect(await failure(await post('/v1/feedback', idea))).toEqual({ status: 503, code: 'unavailable', paths: undefined });
    await expect(api.dealDeck({ difficulty: 'Normal', count: 3 })).resolves.toMatchObject({ cards: [{}, {}, {}] });
  });

  it('answers 500 internal without the database error when the database is down', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { post } = testApp({}, { db: unreachableDatabase });

    const response = await post('/v1/feedback', idea);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: 'internal', message: 'Something went wrong' } });
    expect(logged).toHaveBeenCalledWith(expect.objectContaining({ message: 'connect ECONNREFUSED 10.0.0.5:5432' }));
  });
});

describe('feedback rate limit', () => {
  const from = (address: string) => ({ 'x-forwarded-for': address });

  it('limits each caller per window and lets them send again once it passes', async () => {
    const { post } = testApp({ FEEDBACK_RATE_LIMIT: '2', FEEDBACK_RATE_WINDOW_SECONDS: '60' }, { db: database.db });

    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
    vi.advanceTimersByTime(20_000);
    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
    const limited = await post('/v1/feedback', idea, from('203.0.113.7'));
    expect(await failure(limited)).toMatchObject({ status: 429, code: 'rate_limited' });
    expect(limited.headers.get('retry-after')).toBe('40');

    // Someone else is not affected.
    expect((await post('/v1/feedback', idea, from('198.51.100.2'))).status).toBe(201);
    expect(await database.storedFeedback()).toHaveLength(3);

    vi.advanceTimersByTime(40_000);
    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
  });

  it('ignores addresses the caller adds to X-Forwarded-For in front of the proxy’s', async () => {
    const { post } = testApp({ FEEDBACK_RATE_LIMIT: '1' }, { db: database.db });

    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
    expect((await post('/v1/feedback', idea, from('10.9.8.7, 203.0.113.7'))).status).toBe(429);
  });

  it('finds the caller behind Railway’s edge, which sends the client then one hop of its own', async () => {
    const { post } = testApp({ FEEDBACK_RATE_LIMIT: '1', TRUST_PROXY_HOPS: '2' }, { db: database.db });

    expect((await post('/v1/feedback', idea, from('203.0.113.7, 100.64.0.2'))).status).toBe(201);
    expect((await post('/v1/feedback', idea, from('198.51.100.2, 100.64.0.2'))).status).toBe(201);
    expect((await post('/v1/feedback', idea, from('203.0.113.7, 100.64.0.9'))).status).toBe(429);
  });
});
