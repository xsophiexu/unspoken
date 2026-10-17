import { describe, expect, it, vi } from 'vitest';
import { dealFromBank, gameConfig, normalizeBank, type BankCardInput } from '@unspoken/core';
import { ApiError, clientConfigSchema, createApiClient } from '../src';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// A client whose fetch answers with `response` and records what was sent.
function clientAnswering(response: Response | Error) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  return { api: createApiClient({ baseUrl: 'https://api.example.test/', fetch: fetch as typeof globalThis.fetch }), fetch };
}

const sent = (fetch: ReturnType<typeof clientAnswering>['fetch']) => {
  const [url, init] = fetch.mock.calls[0] ?? [];
  return { url, method: init?.method, body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) };
};

const bank = normalizeBank(
  ['Lighthouse', 'Volcano', 'Origami'].map((word): BankCardInput => ({ word, banned: ['a', 'b', 'c', 'd', 'e', 'f'], difficulty: 'Normal', themes: ['Society'] })),
);

describe('getConfig', () => {
  it('reads the served rules from /v1/config', async () => {
    const { api, fetch } = clientAnswering(json(200, gameConfig));
    await expect(api.getConfig()).resolves.toEqual(gameConfig);
    expect(sent(fetch)).toMatchObject({ url: 'https://api.example.test/v1/config', method: 'GET' });
  });

  it('rejects a response that breaks the contract', async () => {
    const { api } = clientAnswering(json(200, { ...gameConfig, modes: [{ id: 'zen' }] }));
    await expect(api.getConfig()).rejects.toMatchObject({ code: 'invalid_response', status: 200 });
  });
});

describe('dealDeck', () => {
  it('posts the request with All cards by default and returns the dealt deck', async () => {
    const deck = dealFromBank(bank, { difficulty: 'Normal', categories: [], seed: 7 });
    expect(deck.cards).toHaveLength(3);
    const { api, fetch } = clientAnswering(json(200, deck));
    await expect(api.dealDeck({ difficulty: 'Normal', seed: 7 })).resolves.toEqual(deck);
    expect(sent(fetch)).toEqual({
      url: 'https://api.example.test/v1/decks',
      method: 'POST',
      body: { difficulty: 'Normal', categories: [], seed: 7 },
    });
  });

  it('sends an old level name from an older client as the level that replaced it', async () => {
    const { api, fetch } = clientAnswering(json(200, dealFromBank(bank, { difficulty: 'Normal', categories: [], seed: 7 })));
    await api.dealDeck({ difficulty: 'Expert 1', seed: 7 });
    expect(sent(fetch).body).toMatchObject({ difficulty: 'Hard' });
  });

  it('refuses an unknown difficulty without calling the server', async () => {
    const { api, fetch } = clientAnswering(json(200, {}));
    const error = await api.dealDeck({ difficulty: 'Impossible' as never }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'invalid_request', issues: [expect.objectContaining({ path: ['difficulty'] })] });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('sendFeedback', () => {
  const receipt = { id: 'fb_1', receivedAt: '2026-10-16T09:30:00.000Z' };

  it('sends the trimmed idea with its topic and where it came from', async () => {
    const { api, fetch } = clientAnswering(json(201, receipt));
    await expect(
      api.sendFeedback({ topic: 'styles', message: '  More dark styles  ', entryPoint: 'customize', platform: 'ios', appVersion: '2.0.0' }),
    ).resolves.toEqual(receipt);
    expect(sent(fetch).body).toEqual({ topic: 'styles', message: 'More dark styles', entryPoint: 'customize', platform: 'ios', appVersion: '2.0.0' });
  });

  it('accepts 500 characters and refuses 501 or a blank message', async () => {
    const { api, fetch } = clientAnswering(json(201, receipt));
    await expect(api.sendFeedback({ topic: 'other', message: '😀'.repeat(500) })).resolves.toEqual(receipt);
    await expect(api.sendFeedback({ topic: 'other', message: 'x'.repeat(501) })).rejects.toMatchObject({ code: 'invalid_request' });
    await expect(api.sendFeedback({ topic: 'other', message: '   ' })).rejects.toMatchObject({ code: 'invalid_request' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('failures', () => {
  it('passes on the server’s error code, message and issues', async () => {
    const issues = [{ path: ['message'], message: 'Too long' }];
    const { api } = clientAnswering(json(400, { error: { code: 'invalid_request', message: 'Bad feedback', issues } }));
    await expect(api.sendFeedback({ topic: 'words', message: 'More food words' })).rejects.toMatchObject({
      status: 400,
      code: 'invalid_request',
      message: 'Bad feedback',
      issues,
    });
  });

  it('reports an error page without the error body as http_error', async () => {
    const { api } = clientAnswering(new Response('<h1>Bad gateway</h1>', { status: 502 }));
    await expect(api.getConfig()).rejects.toMatchObject({ status: 502, code: 'http_error' });
  });

  it('reports a failed connection as network', async () => {
    const { api } = clientAnswering(new TypeError('Network request failed'));
    await expect(api.getConfig()).rejects.toMatchObject({ status: 0, code: 'network', message: 'Network request failed' });
  });
});

describe('clientConfigSchema', () => {
  it('needs an API URL and accepts an optional Analytics id', () => {
    expect(clientConfigSchema.parse({ apiBaseUrl: 'https://api.unspoken.app', gaMeasurementId: 'G-ABC123' })).toBeTruthy();
    expect(clientConfigSchema.safeParse({ apiBaseUrl: undefined }).success).toBe(false);
    expect(clientConfigSchema.safeParse({ apiBaseUrl: 'https://x.test', gaMeasurementId: 'UA-1' }).success).toBe(false);
  });
});
