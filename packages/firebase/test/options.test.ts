import { describe, expect, it } from 'vitest';

import { firebaseOptions } from '../src';

const env = {
  apiKey: 'key',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo',
  storageBucket: 'demo.firebasestorage.app',
  messagingSenderId: '123',
  appId: '1:123:web:abc',
};

describe('firebaseOptions', () => {
  it('uses the values when all are set, trimmed', () => {
    expect(firebaseOptions({ ...env, apiKey: ' key\n' })).toEqual(env);
  });

  it('is null when any value is missing or blank, so the app runs without Firebase', () => {
    expect(firebaseOptions({ ...env, appId: undefined })).toBeNull();
    expect(firebaseOptions({ ...env, projectId: '  ' })).toBeNull();
    expect(firebaseOptions({})).toBeNull();
  });
});
