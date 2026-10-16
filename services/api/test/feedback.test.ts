import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { failure, fakeFirestore, testApp } from './fixtures';

const now = new Date('2026-10-16T09:30:00.000Z');
const idea = { topic: 'styles', message: '  More dark styles, please  ', entryPoint: 'customize', platform: 'ios', appVersion: '2.0.0' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

describe('POST /v1/feedback', () => {
  it('stores the trimmed idea, where it came from and when, in the configured collection', async () => {
    const { firestore, added } = fakeFirestore();
    const { post } = testApp({ FEEDBACK_COLLECTION: 'ideas' }, { firestore });

    const response = await post('/v1/feedback', idea);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 'doc-1', receivedAt: '2026-10-16T09:30:00.000Z' });
    expect(added).toStrictEqual([{ collection: 'ideas', document: { ...idea, message: 'More dark styles, please', receivedAt: now } }]);
  });

  it('stores only the fields sent, since Firestore refuses undefined values', async () => {
    const { firestore, added } = fakeFirestore();
    const { api } = testApp({}, { firestore });

    await expect(api.sendFeedback({ topic: 'words', message: 'More food words' })).resolves.toEqual({ id: 'doc-1', receivedAt: now.toISOString() });
    expect(added).toStrictEqual([{ collection: 'feedback', document: { topic: 'words', message: 'More food words', receivedAt: now } }]);
  });

  it.each([
    [{ topic: 'other', message: 'x'.repeat(501) }, ['message']],
    [{ topic: 'other', message: '   ' }, ['message']],
    [{ topic: 'praise', message: 'Love it' }, ['topic']],
    [{ topic: 'other', message: 'Hi', platform: 'windows' }, ['platform']],
    [{ topic: 'other', message: 'Hi', appVersion: '1'.repeat(41) }, ['appVersion']],
  ])('rejects %j at %j and stores nothing', async (body, path) => {
    const { firestore, added } = fakeFirestore();
    const { post } = testApp({}, { firestore });

    expect(await failure(await post('/v1/feedback', body))).toEqual({ status: 400, code: 'invalid_request', paths: [path] });
    expect(added).toEqual([]);
  });

  it('accepts 500 characters counted as the player sees them', async () => {
    const { firestore, added } = fakeFirestore();
    const { post } = testApp({}, { firestore });

    expect((await post('/v1/feedback', { topic: 'other', message: '😀'.repeat(500) })).status).toBe(201);
    expect(added).toHaveLength(1);
  });

  it('answers 503 unavailable without Firebase while decks still deal', async () => {
    const { api, post } = testApp();

    expect(await failure(await post('/v1/feedback', idea))).toEqual({ status: 503, code: 'unavailable', paths: undefined });
    await expect(api.dealDeck({ difficulty: 'Normal', count: 3 })).resolves.toMatchObject({ cards: [{}, {}, {}] });
  });

  it('answers 500 internal without the storage error when Firestore fails', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { firestore } = fakeFirestore({ down: true });
    const { post } = testApp({}, { firestore });

    const response = await post('/v1/feedback', idea);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: 'internal', message: 'Something went wrong' } });
    expect(logged).toHaveBeenCalledWith(expect.objectContaining({ message: '14 UNAVAILABLE: Firestore is down' }));
  });
});

describe('feedback rate limit', () => {
  const from = (address: string) => ({ 'x-forwarded-for': address });

  it('limits each caller per window and lets them send again once it passes', async () => {
    const { firestore, added } = fakeFirestore();
    const { post } = testApp({ FEEDBACK_RATE_LIMIT: '2', FEEDBACK_RATE_WINDOW_SECONDS: '60' }, { firestore });

    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
    vi.advanceTimersByTime(20_000);
    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
    const limited = await post('/v1/feedback', idea, from('203.0.113.7'));
    expect(await failure(limited)).toMatchObject({ status: 429, code: 'rate_limited' });
    expect(limited.headers.get('retry-after')).toBe('40');

    // Someone else is not affected.
    expect((await post('/v1/feedback', idea, from('198.51.100.2'))).status).toBe(201);
    expect(added).toHaveLength(3);

    vi.advanceTimersByTime(40_000);
    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
  });

  it('ignores addresses the caller adds to X-Forwarded-For in front of the proxy’s', async () => {
    const { firestore } = fakeFirestore();
    const { post } = testApp({ FEEDBACK_RATE_LIMIT: '1' }, { firestore });

    expect((await post('/v1/feedback', idea, from('203.0.113.7'))).status).toBe(201);
    expect((await post('/v1/feedback', idea, from('10.9.8.7, 203.0.113.7'))).status).toBe(429);
  });
});
