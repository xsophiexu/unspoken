// @unspoken/firebase: Firebase for the Unspoken clients. Generic setup (options from env, anonymous
// sign-in, an adapter boundary) plus Send feedback on Firestore. The SDK itself (getFirebase and
// the real adapter) is the separate entry '@unspoken/firebase/sdk', so code and tests that only
// need the logic never load Firebase.

export * from './options';
export * from './adapter';
export * from './auth';
export * from './feedback';
