// Small text helpers shared by every platform. Wording comes from the copy catalog
// (@unspoken/content); these only fill it in.

// A message with singular and plural forms. Either may contain {n} for the number.
export type Plural = { one: string; other: string };

// Fill {name} placeholders. Unknown placeholders are left as they are so missing params are visible.
export function format(template: string, params: Readonly<Record<string, string | number>> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole));
}

// Pick the singular form for exactly 1 and the plural otherwise, then fill {n} and any other params.
export function plural(n: number, forms: Plural, params: Readonly<Record<string, string | number>> = {}): string {
  return format(n === 1 ? forms.one : forms.other, { n, ...params });
}

// "1 skip", "2 skips". Pass the plural when it isn't just the word plus "s".
export function count(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

// 150 → "2:30".
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// The round timer input fills from the right, like a microwave: typing 1, 4, 5 reads 1:45.
// Keeps digits only, drops leading zeros and stops at four digits (99:59).
export function sanitizeTimerDigits(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+/, '').slice(0, 4);
}

// Timer digits to seconds. Seconds past 59 are capped: "199" is 1:59.
export function timerDigitsToSeconds(digits: string): number {
  const padded = digits.padStart(3, '0');
  const m = Number(padded.slice(0, -2));
  const s = Math.min(59, Number(padded.slice(-2)));
  return m * 60 + s;
}

// Seconds to timer digits: 150 → "230".
export function secondsToTimerDigits(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}${s.toString().padStart(2, '0')}`.replace(/^0+/, '');
}

// What the timer input shows for its digits: "" → "0:00", "5" → "0:05", "145" → "1:45".
export function timerDigitsLabel(digits: string): string {
  const padded = digits.padStart(3, '0');
  return `${Number(padded.slice(0, -2))}:${padded.slice(-2)}`;
}

// How many words and letters a phrase has (Reverse shows "2 words · 11 letters" under the blanks).
export function wordShape(word: string): { words: number; letters: number } {
  const words = word.trim().split(/\s+/).filter(Boolean).length;
  const letters = word.replace(/[^\p{L}\p{N}]/gu, '').length;
  return { words, letters };
}
