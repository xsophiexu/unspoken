import { connectAuthEmulator, signOut } from 'firebase/auth';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FeedbackError, createFeedbackClient, signInAnonymously } from '../../src';
import { firebaseAdapter, getFirebase } from '../../src/sdk';

// firestore.rules against the real Firestore and Auth emulators (started by `pnpm test:rules`).
// The real adapter and feedback client send the valid messages; hand-made batches try the rest.

const PROJECT = 'demo-unspoken';
const options = { apiKey: 'demo-key', authDomain: `${PROJECT}.firebaseapp.com`, projectId: PROJECT, storageBucket: '', messagingSenderId: '0', appId: 'demo' };
const { auth, firestore } = getFirebase(options);
const adapter = firebaseAdapter(options);
const feedback = createFeedbackClient(adapter);

beforeAll(() => {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
});

// Each test starts as a new anonymous user, so one test's send limit never touches another.
beforeEach(async () => {
  await signOut(auth);
});

const user = () => signInAnonymously(adapter);

const goodDoc = (uid: string) => ({
  topic: 'modes',
  message: 'A team mode',
  entryPoint: 'modes',
  platform: 'web',
  appVersion: '1.0.0',
  uid,
  receivedAt: serverTimestamp(),
});

const newWindow = () => ({ count: 1, since: serverTimestamp() });

// One batch like the client's: a feedback doc plus the sender's window (or a different one).
async function sendBatch(data: Record<string, unknown>, limit: { uid: string; data: Record<string, unknown> } | null) {
  const batch = writeBatch(firestore);
  batch.set(doc(collection(firestore, 'feedback')), data);
  if (limit) batch.set(doc(firestore, 'feedbackLimits', limit.uid), limit.data);
  await batch.commit();
}

const denied = (promise: Promise<unknown>) => expect(promise).rejects.toMatchObject({ code: 'permission-denied' });

const ADMIN = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

// Stores a feedbackLimits doc as admin (bypassing the rules), e.g. a window that opened two days
// ago: the emulator always uses its real clock for request.time, so time can't be moved forward.
async function storeLimitAsAdmin(uid: string, fields: Record<string, unknown>) {
  const response = await fetch(`${ADMIN}/feedbackLimits/${uid}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Admin write failed: ${response.status}`);
}
const daysAgo = (days: number) => ({ timestampValue: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() });

// Reads what was stored, bypassing the rules the way the console or admin credentials do.
async function storedFeedback(): Promise<Record<string, { stringValue?: string; nullValue?: null; timestampValue?: string }>[]> {
  const response = await fetch(`${ADMIN}/feedback?pageSize=500`, {
    headers: { Authorization: 'Bearer owner' },
  });
  const body = (await response.json()) as { documents?: { fields: Record<string, never> }[] };
  return (body.documents ?? []).map((d) => d.fields);
}

describe('feedback', () => {
  it('accepts a message from the feedback client and stores it with the sender and server time', async () => {
    await feedback.sendFeedback({ topic: 'words', message: '  More food words  ', entryPoint: 'menu', platform: 'android', appVersion: '1.2.3' });
    const uid = adapter.currentUid();
    const mine = (await storedFeedback()).find((f) => f.uid?.stringValue === uid);
    expect(mine).toMatchObject({
      topic: { stringValue: 'words' },
      message: { stringValue: 'More food words' },
      entryPoint: { stringValue: 'menu' },
      platform: { stringValue: 'android' },
      appVersion: { stringValue: '1.2.3' },
    });
    expect(mine?.receivedAt?.timestampValue).toEqual(expect.any(String));
  });

  it('accepts a message with no entry point or app version', async () => {
    await expect(feedback.sendFeedback({ topic: 'other', message: 'Hi', platform: 'ios' })).resolves.toBeUndefined();
  });

  const send = (message: string) => feedback.sendFeedback({ topic: 'styles', message, platform: 'web' });
  const errorCodeOf = (promise: Promise<unknown>) => promise.then(() => 'sent', (e: unknown) => (e instanceof FeedbackError ? e.code : String(e)));

  it('accepts two messages from the same user and refuses a third', async () => {
    await expect(send('A sand color')).resolves.toBeUndefined();
    await expect(send('And a sea color')).resolves.toBeUndefined();
    expect(await errorCodeOf(send('And a sky color'))).toBe('rateLimited');
  });

  it('refuses a third message even when the client doesn’t check first', async () => {
    const uid = await user();
    await sendBatch(goodDoc(uid), { uid, data: newWindow() });
    await sendBatch(goodDoc(uid), { uid, data: { count: 2, since: (await getDoc(doc(firestore, 'feedbackLimits', uid))).data()?.since } });
    await denied(sendBatch(goodDoc(uid), { uid, data: newWindow() }));
    const batch = writeBatch(firestore);
    batch.set(doc(collection(firestore, 'feedback')), goodDoc(uid));
    batch.update(doc(firestore, 'feedbackLimits', uid), { count: 3 });
    await denied(batch.commit());
  });

  it('refuses a message that leaves the window unchanged', async () => {
    const uid = await user();
    await sendBatch(goodDoc(uid), { uid, data: newWindow() });
    await denied(sendBatch(goodDoc(uid), null));
  });

  it('opens a new window a day after the first of two messages', async () => {
    const uid = await user();
    await storeLimitAsAdmin(uid, { count: { integerValue: '2' }, since: daysAgo(1.01) });
    await expect(send('A new day')).resolves.toBeUndefined();
    expect((await getDoc(doc(firestore, 'feedbackLimits', uid))).data()?.count).toBe(1);
  });

  it('still refuses within the day', async () => {
    const uid = await user();
    await storeLimitAsAdmin(uid, { count: { integerValue: '2' }, since: daysAgo(0.99) });
    expect(await errorCodeOf(send('Too soon'))).toBe('rateLimited');
    await denied(sendBatch(goodDoc(uid), { uid, data: newWindow() }));
  });

  it('opens a window over a stamp left by the old one-a-minute limit', async () => {
    const uid = await user();
    await storeLimitAsAdmin(uid, { last: daysAgo(0) });
    await expect(send('After the update')).resolves.toBeUndefined();
  });

  it('lets another user send after someone used up their two', async () => {
    await send('First');
    await send('Second');
    await signOut(auth);
    await expect(send('Someone else')).resolves.toBeUndefined();
  });

  it('refuses a message without the window in the same batch', async () => {
    const uid = await user();
    await denied(sendBatch(goodDoc(uid), null));
  });

  it('refuses a window that does not start at the server time', async () => {
    const uid = await user();
    await denied(sendBatch(goodDoc(uid), { uid, data: { count: 1, since: Timestamp.fromMillis(Date.now()) } }));
  });

  it('refuses a message when signed out', async () => {
    await denied(sendBatch(goodDoc('nobody'), { uid: 'nobody', data: newWindow() }));
  });

  it.each([
    ['an extra key', { extra: 'x' }],
    ['a missing key', { appVersion: undefined }],
    ['an unknown topic', { topic: 'colours' }],
    ['an unknown entry point', { entryPoint: 'settings' }],
    ['a null platform', { platform: null }],
    ['an unknown platform', { platform: 'desktop' }],
    ['an empty message', { message: '' }],
    ['a message over 500 characters', { message: 'x'.repeat(501) }],
    ['a message that is not a string', { message: 42 }],
    ['an app version over 32 characters', { appVersion: 'x'.repeat(33) }],
    ['a client-side time', { receivedAt: Timestamp.fromMillis(Date.now()) }],
  ])('refuses a message with %s', async (_, change) => {
    const uid = await user();
    const data: Record<string, unknown> = { ...goodDoc(uid), ...change };
    for (const key of Object.keys(data)) if (data[key] === undefined) delete data[key];
    await denied(sendBatch(data, { uid, data: newWindow() }));
  });

  it('refuses a message signed with someone else’s uid', async () => {
    const uid = await user();
    await denied(sendBatch({ ...goodDoc(uid), uid: 'someone-else' }, { uid, data: newWindow() }));
  });

  it('accepts the hand-made batch the rules describe (so the refusals above are about the change)', async () => {
    const uid = await user();
    await expect(sendBatch(goodDoc(uid), { uid, data: newWindow() })).resolves.toBeUndefined();
  });

  it('cannot be read, changed or deleted', async () => {
    const uid = await user();
    const ref = doc(collection(firestore, 'feedback'));
    const batch = writeBatch(firestore);
    batch.set(ref, goodDoc(uid));
    batch.set(doc(firestore, 'feedbackLimits', uid), newWindow());
    await batch.commit();

    await denied(getDoc(ref));
    await denied(updateDoc(ref, { message: 'Changed' }));
    const remove = writeBatch(firestore);
    remove.delete(ref);
    await denied(remove.commit());
  });
});

describe('feedbackLimits', () => {
  const ref = (uid: string) => doc(firestore, 'feedbackLimits', uid);

  it('lets a user open their own window at the server time with exactly count and since', async () => {
    const uid = await user();
    await denied(setDoc(ref(uid), { count: 1, since: serverTimestamp(), extra: true }));
    await denied(setDoc(ref(uid), { count: 1 }));
    await denied(setDoc(ref(uid), { count: 1, since: Timestamp.fromMillis(0) }));
    await denied(setDoc(ref(uid), { count: 2, since: serverTimestamp() }));
    await denied(setDoc(ref(uid), { count: 1.5, since: serverTimestamp() }));
    await denied(setDoc(ref(uid), { last: serverTimestamp() }));
    await denied(setDoc(ref('someone-else'), newWindow()));
    await expect(setDoc(ref(uid), newWindow())).resolves.toBeUndefined();
  });

  it('can only add one idea at a time to a window, keeping its start', async () => {
    const uid = await user();
    await setDoc(ref(uid), newWindow());
    await denied(updateDoc(ref(uid), { count: 1 }));
    await denied(updateDoc(ref(uid), { count: 2, since: serverTimestamp() }));
    await expect(updateDoc(ref(uid), { count: 2 })).resolves.toBeUndefined();
    await denied(updateDoc(ref(uid), { count: 3 }));
  });

  it('cannot be reset by writing it alone, before the day is over', async () => {
    const uid = await user();
    await send2(uid);
    await denied(setDoc(ref(uid), newWindow()));
    await denied(updateDoc(ref(uid), { count: 1 }));
    await denied(updateDoc(ref(uid), { count: 0 }));
    await storeLimitAsAdmin(uid, { count: { integerValue: '2' }, since: daysAgo(0.5) });
    await denied(setDoc(ref(uid), newWindow()));
  });

  it('cannot be deleted', async () => {
    const uid = await user();
    await setDoc(ref(uid), newWindow());
    await denied(deleteDoc(ref(uid)));
  });

  it('can be read by its owner, and by nobody else', async () => {
    const uid = await user();
    await setDoc(ref(uid), newWindow());
    const mine = await getDoc(ref(uid));
    expect(mine.data()).toMatchObject({ count: 1, since: expect.any(Timestamp) });

    await signOut(auth);
    await user();
    await denied(getDoc(ref(uid)));
    await denied(getDocs(collection(firestore, 'feedbackLimits')));
  });

  // Two ideas through the client, which fills the window.
  async function send2(uid: string) {
    expect(adapter.currentUid()).toBe(uid);
    await feedback.sendFeedback({ topic: 'other', message: 'One', platform: 'web' });
    await feedback.sendFeedback({ topic: 'other', message: 'Two', platform: 'web' });
  }
});

describe('everything else', () => {
  it('is closed', async () => {
    await user();
    await denied(setDoc(doc(firestore, 'lobbies', 'x'), { a: 1 }));
    await denied(getDoc(doc(firestore, 'lobbies', 'x')));
  });
});
