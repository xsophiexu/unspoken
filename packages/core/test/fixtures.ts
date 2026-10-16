import { defaultSettings, type Card, type GameSettings, type ModeId } from '../src';

// Cards with ten banned words each: "Word 0" bans "Word 0 ban 1" … "Word 0 ban 10".
export function makeCards(count: number, banned = 10): Card[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `word-${i}`,
    word: `Word ${i}`,
    banned: Array.from({ length: banned }, (_, b) => `Word ${i} ban ${b + 1}`),
  }));
}

export function settingsFor(mode: ModeId, overrides: Partial<GameSettings> = {}): GameSettings {
  return { ...defaultSettings(), mode, ...overrides };
}

// Apply actions in order through a reducer.
export function run<S, A>(reducer: (state: S, action: A) => S, state: S, actions: readonly A[]): S {
  return actions.reduce(reducer, state);
}

export function times<A>(n: number, action: A): A[] {
  return Array.from({ length: n }, () => action);
}
