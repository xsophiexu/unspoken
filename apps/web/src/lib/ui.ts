import type { TextStyleName } from '@unspoken/design-tokens';

// Joins class names, skipping empty ones.
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

// The global class for a design-token text style (generated in theme/css.ts).
export function text(name: TextStyleName): string {
  return `un-text-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

// "7 pts" → { before: '', number: '7', after: ' pts' }, so layouts can set the number big.
export function splitNumber(phrase: string, n: number): { before: string; number: string; after: string } {
  const number = String(n);
  const at = phrase.indexOf(number);
  if (at < 0) return { before: phrase, number: '', after: '' };
  return { before: phrase.slice(0, at), number, after: phrase.slice(at + number.length) };
}
