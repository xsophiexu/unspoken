import { describe, expect, it } from 'vitest';

import { signInAnonymously } from '../src';

import { fakeAdapter, sdkError } from './fakeAdapter';

describe('signInAnonymously', () => {
  it('returns the signed-in user without signing in again', async () => {
    const { adapter, state } = fakeAdapter({ uid: 'player-1' });
    expect(await signInAnonymously(adapter)).toBe('player-1');
    expect(state.signIns).toBe(0);
  });

  it('signs in once when called twice at the same time', async () => {
    const { adapter, state } = fakeAdapter();
    const [first, second] = await Promise.all([signInAnonymously(adapter), signInAnonymously(adapter)]);
    expect(first).toBe('anon-1');
    expect(second).toBe('anon-1');
    expect(state.signIns).toBe(1);
  });

  it('can try again after a failed sign-in', async () => {
    const { adapter, state } = fakeAdapter({ signInError: sdkError('auth/network-request-failed') });
    await expect(signInAnonymously(adapter)).rejects.toMatchObject({ code: 'auth/network-request-failed' });
    state.signInError = undefined;
    expect(await signInAnonymously(adapter)).toBe('anon-2');
  });
});
