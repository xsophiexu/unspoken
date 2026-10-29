import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SERVER_TIME } from '../src';

// The Firebase SDK itself is the boundary here: each module is replaced by a recorder, so these
// tests check what the real adapter asks Firebase to do.
const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn((options: unknown) => ({ name: '[DEFAULT]', options })),
  auth: { currentUser: null as { uid: string } | null },
  signInAnonymously: vi.fn(async () => ({ user: { uid: 'anon-uid' } })),
  sets: [] as { ref: unknown; data: unknown }[],
  commit: vi.fn(async () => undefined),
}));

vi.mock('firebase/app', () => ({ getApps: () => [], getApp: vi.fn(), initializeApp: sdk.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: () => sdk.auth, signInAnonymously: sdk.signInAnonymously }));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({ db: true }),
  collection: (_db: unknown, name: string) => ({ collection: name }),
  doc: (parent: { collection?: string }, path?: string) => (path ? { path } : { newDocIn: parent.collection }),
  serverTimestamp: () => 'SERVER_TIMESTAMP_SENTINEL',
  writeBatch: () => ({ set: (ref: unknown, data: unknown) => sdk.sets.push({ ref, data }), commit: sdk.commit }),
}));

const options = { apiKey: 'k', authDomain: 'd', projectId: 'p', storageBucket: 's', messagingSenderId: 'm', appId: 'a' };

beforeEach(() => {
  sdk.sets.length = 0;
});

describe('firebaseAdapter', () => {
  it('starts Firebase only when first used, and only once', async () => {
    const { firebaseAdapter, getFirebase } = await import('../src/sdk');
    const adapter = firebaseAdapter(options);
    expect(sdk.initializeApp).not.toHaveBeenCalled();

    expect(adapter.currentUid()).toBeNull();
    expect(await adapter.signInAnonymously()).toBe('anon-uid');
    getFirebase(options);
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
    expect(sdk.initializeApp).toHaveBeenCalledWith(options);
  });

  it('commits adds and sets in one batch, with server timestamps in place of SERVER_TIME', async () => {
    const { firebaseAdapter } = await import('../src/sdk');
    await firebaseAdapter(options).commit([
      { kind: 'add', collection: 'feedback', data: { message: 'Hi', meta: { at: SERVER_TIME }, receivedAt: SERVER_TIME } },
      { kind: 'set', path: 'feedbackLimits/u1', data: { last: SERVER_TIME } },
    ]);

    expect(sdk.sets).toEqual([
      { ref: { newDocIn: 'feedback' }, data: { message: 'Hi', meta: { at: 'SERVER_TIMESTAMP_SENTINEL' }, receivedAt: 'SERVER_TIMESTAMP_SENTINEL' } },
      { ref: { path: 'feedbackLimits/u1' }, data: { last: 'SERVER_TIMESTAMP_SENTINEL' } },
    ]);
    expect(sdk.commit).toHaveBeenCalledTimes(1);
  });
});
