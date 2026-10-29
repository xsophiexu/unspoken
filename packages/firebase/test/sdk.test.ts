import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SERVER_TIME } from '../src';

// The Firebase SDK itself is the boundary here: each module is replaced by a recorder, so these
// tests check what the real adapter asks Firebase to do.
const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn((options: unknown) => ({ name: '[DEFAULT]', options })),
  // restored stands for a user Firebase brings back from an earlier visit once auth state is ready.
  auth: {
    currentUser: null as { uid: string } | null,
    restored: null as { uid: string } | null,
    async authStateReady() {
      this.currentUser = this.restored;
    },
  },
  signInAnonymously: vi.fn(async () => ({ user: { uid: 'anon-uid' } })),
  sets: [] as { ref: unknown; data: unknown }[],
  updates: [] as { ref: unknown; data: unknown }[],
  // What getDoc finds, by path.
  stored: {} as Record<string, unknown>,
  commit: vi.fn(async () => undefined),
  Timestamp: class {
    constructor(readonly millis: number) {}
    toDate() {
      return new Date(this.millis);
    }
  },
}));

vi.mock('firebase/app', () => ({ getApps: () => [], getApp: vi.fn(), initializeApp: sdk.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: () => sdk.auth, signInAnonymously: sdk.signInAnonymously }));
vi.mock('firebase/firestore', () => ({
  Timestamp: sdk.Timestamp,
  getDoc: async (ref: { path: string }) => ({ exists: () => ref.path in sdk.stored, data: () => sdk.stored[ref.path] }),
  getFirestore: () => ({ db: true }),
  collection: (_db: unknown, name: string) => ({ collection: name }),
  doc: (parent: { collection?: string }, path?: string) => (path ? { path } : { newDocIn: parent.collection }),
  serverTimestamp: () => 'SERVER_TIMESTAMP_SENTINEL',
  writeBatch: () => ({
    set: (ref: unknown, data: unknown) => sdk.sets.push({ ref, data }),
    update: (ref: unknown, data: unknown) => sdk.updates.push({ ref, data }),
    commit: sdk.commit,
  }),
}));

const options = { apiKey: 'k', authDomain: 'd', projectId: 'p', storageBucket: 's', messagingSenderId: 'm', appId: 'a' };

beforeEach(() => {
  sdk.sets.length = 0;
  sdk.updates.length = 0;
  sdk.stored = {};
  sdk.auth.currentUser = null;
  sdk.auth.restored = null;
  sdk.signInAnonymously.mockClear();
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

  it('reuses the user restored from an earlier visit instead of signing in as someone new', async () => {
    const { firebaseAdapter } = await import('../src/sdk');
    sdk.auth.restored = { uid: 'returning-uid' };

    expect(await firebaseAdapter(options).signInAnonymously()).toBe('returning-uid');
    expect(sdk.signInAnonymously).not.toHaveBeenCalled();
  });

  it('commits adds, sets and updates in one batch, with server timestamps in place of SERVER_TIME', async () => {
    const { firebaseAdapter } = await import('../src/sdk');
    sdk.commit.mockClear();
    await firebaseAdapter(options).commit([
      { kind: 'add', collection: 'feedback', data: { message: 'Hi', meta: { at: SERVER_TIME }, receivedAt: SERVER_TIME } },
      { kind: 'set', path: 'feedbackLimits/u1', data: { count: 1, since: SERVER_TIME } },
      { kind: 'update', path: 'feedbackLimits/u2', data: { count: 2 } },
    ]);

    expect(sdk.sets).toEqual([
      { ref: { newDocIn: 'feedback' }, data: { message: 'Hi', meta: { at: 'SERVER_TIMESTAMP_SENTINEL' }, receivedAt: 'SERVER_TIMESTAMP_SENTINEL' } },
      { ref: { path: 'feedbackLimits/u1' }, data: { count: 1, since: 'SERVER_TIMESTAMP_SENTINEL' } },
    ]);
    expect(sdk.updates).toEqual([{ ref: { path: 'feedbackLimits/u2' }, data: { count: 2 } }]);
    expect(sdk.commit).toHaveBeenCalledTimes(1);
  });

  it('reads a document with its timestamps as Dates, or null when there is none', async () => {
    const { firebaseAdapter } = await import('../src/sdk');
    sdk.stored['feedbackLimits/u1'] = { count: 2, since: new sdk.Timestamp(1_700_000_000_000), log: [new sdk.Timestamp(0)] };
    const adapter = firebaseAdapter(options);

    expect(await adapter.get('feedbackLimits/u1')).toEqual({ count: 2, since: new Date(1_700_000_000_000), log: [new Date(0)] });
    expect(await adapter.get('feedbackLimits/nobody')).toBeNull();
  });
});
