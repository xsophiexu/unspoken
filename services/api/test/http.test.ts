import { gameConfig } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config';
import { failure, fakeFirestore, testApp } from './fixtures';

describe('GET /v1/config', () => {
  it('serves the rules the apps bundle', async () => {
    await expect(testApp().api.getConfig()).resolves.toEqual(gameConfig);
  });
});

describe('the service', () => {
  it('answers the health check', async () => {
    const response = await testApp().app.request('/health');
    expect(response.status).toBe(200);
  });

  it('answers unknown endpoints with not_found', async () => {
    const { app, post } = testApp();
    expect(await failure(await app.request('/v1/rooms'))).toMatchObject({ status: 404, code: 'not_found' });
    expect(await failure(await post('/v1/config', {}))).toMatchObject({ status: 404, code: 'not_found' });
  });

  it('refuses a body over the size limit with payload_too_large', async () => {
    const { firestore, added } = fakeFirestore();
    const { post } = testApp({ BODY_LIMIT_BYTES: '1024' }, { firestore });

    const response = await post('/v1/feedback', { topic: 'other', message: 'Hi', appVersion: 'x'.repeat(1100) });
    expect(await failure(response)).toMatchObject({ status: 413, code: 'payload_too_large' });
    expect(added).toEqual([]);
  });
});

describe('CORS', () => {
  const env = { CORS_ORIGINS: 'https://xsophiexu.github.io, http://localhost:8081' };
  const allowedOrigin = (response: Response) => response.headers.get('access-control-allow-origin');

  it('lets listed origins read responses, errors included, and no others', async () => {
    const { app, post } = testApp(env);

    expect(allowedOrigin(await app.request('/v1/config', { headers: { origin: 'http://localhost:8081' } }))).toBe('http://localhost:8081');
    expect(allowedOrigin(await post('/v1/feedback', {}, { origin: 'https://xsophiexu.github.io' }))).toBe('https://xsophiexu.github.io');
    expect(allowedOrigin(await app.request('/v1/config', { headers: { origin: 'https://evil.example' } }))).toBeNull();
  });

  it('answers the preflight for a JSON POST from a listed origin', async () => {
    const preflight = await testApp(env).app.request('/v1/decks', {
      method: 'OPTIONS',
      headers: { origin: 'https://xsophiexu.github.io', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' },
    });

    expect(preflight.status).toBe(204);
    expect(allowedOrigin(preflight)).toBe('https://xsophiexu.github.io');
    expect(preflight.headers.get('access-control-allow-methods')).toContain('POST');
    expect(preflight.headers.get('access-control-allow-headers')).toBe('content-type');
  });

  it('serves native apps, which send no Origin', async () => {
    const response = await testApp(env).app.request('/v1/config');
    expect(response.status).toBe(200);
    expect(allowedOrigin(response)).toBeNull();
  });
});

describe('environment', () => {
  const key = { type: 'service_account', project_id: 'unspoken-prod', client_email: 'api@unspoken-prod.iam.gserviceaccount.com', private_key: 'KEY' };

  it('turns feedback on from a service account key alone, using its project', () => {
    expect(loadConfig({ FIREBASE_SERVICE_ACCOUNT: JSON.stringify(key) }).firebase).toEqual({
      projectId: 'unspoken-prod',
      serviceAccount: { projectId: 'unspoken-prod', clientEmail: key.client_email, privateKey: 'KEY' },
    });
    expect(loadConfig({ FIREBASE_PROJECT_ID: '' }).firebase).toBeUndefined();
  });

  it('refuses to start with bad values, naming each variable', () => {
    const bad = { PORT: 'eighty', CORS_ORIGINS: 'https://xsophiexu.github.io/unspoken', FIREBASE_SERVICE_ACCOUNT: '{not json' };
    for (const name of Object.keys(bad)) expect(() => loadConfig(bad)).toThrow(`at ${name}`);
  });
});
