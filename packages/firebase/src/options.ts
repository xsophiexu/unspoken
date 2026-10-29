// The Firebase web config (apiKey, projectId and so on). These values are public by design: they
// name the project, and firestore.rules decides what a client may do. Each app reads them from its
// own env (NEXT_PUBLIC_FIREBASE_* or EXPO_PUBLIC_FIREBASE_*) and passes them to firebaseOptions().

export const FIREBASE_OPTION_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
export type FirebaseOptionKey = (typeof FIREBASE_OPTION_KEYS)[number];

export type FirebaseOptions = Readonly<Record<FirebaseOptionKey, string>>;

// The options when every value is set, or null when any is missing or blank (the app then runs
// without Firebase, and whatever needs it reports that it is not configured).
export function firebaseOptions(values: Partial<Record<FirebaseOptionKey, string | undefined>>): FirebaseOptions | null {
  const entries = FIREBASE_OPTION_KEYS.map((key) => [key, values[key]?.trim() ?? ''] as const);
  if (entries.some(([, value]) => value === '')) return null;
  return Object.fromEntries(entries) as FirebaseOptions;
}
