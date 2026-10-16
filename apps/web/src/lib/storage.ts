// localStorage, guarded: private windows, blocked site data and server rendering all fall back
// to "nothing saved" instead of throwing.

export function readStored(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked: the choice lasts until the page closes.
  }
}
