import { describe, expect, it } from 'vitest';

import {
  count,
  format,
  formatClock,
  formatParts,
  plural,
  pluralParts,
  sanitizeTimerDigits,
  secondsToTimerDigits,
  timerDigitsLabel,
  timerDigitsToSeconds,
  wordShape,
} from '../src';

describe('count labels', () => {
  it('uses the singular only for exactly one', () => {
    expect(count(1, 'point')).toBe('1 point');
    expect(count(1, 'skip')).toBe('1 skip');
    expect(count(1, 'card')).toBe('1 card');
    expect(count(0, 'skip')).toBe('0 skips');
    expect(count(2, 'pt')).toBe('2 pts');
  });

  it('takes an irregular plural', () => {
    expect(count(3, 'match', 'matches')).toBe('3 matches');
  });

  it('fills catalog plural forms', () => {
    const banned = { one: '{n} banned word', other: '{n} banned words' };
    expect(plural(1, banned)).toBe('1 banned word');
    expect(plural(7, banned)).toBe('7 banned words');
    expect(plural(1, { one: 'point', other: 'points' })).toBe('point');
  });
});

describe('format', () => {
  it('fills named placeholders and leaves unknown ones visible', () => {
    expect(format('{a} of {b}', { a: 1, b: 'three' })).toBe('1 of three');
    expect(format('{a} {missing}', { a: 'x' })).toBe('x {missing}');
  });
});

describe('clock', () => {
  it('formats minutes and padded seconds', () => {
    expect(formatClock(150)).toBe('2:30');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('microwave timer input', () => {
  it('fills from the right as digits are typed', () => {
    expect(timerDigitsLabel('')).toBe('0:00');
    expect(timerDigitsLabel('1')).toBe('0:01');
    expect(timerDigitsLabel('14')).toBe('0:14');
    expect(timerDigitsLabel('145')).toBe('1:45');
    expect(timerDigitsToSeconds('145')).toBe(105);
  });

  it('caps seconds at 59', () => {
    expect(timerDigitsToSeconds('199')).toBe(119);
  });

  it('keeps digits only, without leading zeros, up to four', () => {
    expect(sanitizeTimerDigits('0a1:3 0')).toBe('130');
    expect(sanitizeTimerDigits('123456')).toBe('1234');
  });

  it('round-trips a default length', () => {
    expect(secondsToTimerDigits(150)).toBe('230');
    expect(timerDigitsToSeconds(secondsToTimerDigits(300))).toBe(300);
  });
});

describe('wordShape', () => {
  it('counts words and letters, ignoring spaces and punctuation', () => {
    expect(wordShape('Hangover')).toEqual({ words: 1, letters: 8 });
    expect(wordShape('Rock-paper-scissors')).toEqual({ words: 1, letters: 17 });
    expect(wordShape('Bedtime story')).toEqual({ words: 2, letters: 12 });
  });
});

describe('formatParts', () => {
  it('splits a message into words and filled values, which join back to format()', () => {
    const parts = formatParts('{mode} · {difficulty}', { mode: 'Classic', difficulty: 'Hard' });
    expect(parts).toEqual([{ text: 'Classic', param: 'mode' }, { text: ' · ' }, { text: 'Hard', param: 'difficulty' }]);
    expect(parts.map((p) => p.text).join('')).toBe(format('{mode} · {difficulty}', { mode: 'Classic', difficulty: 'Hard' }));
  });

  it('keeps unknown placeholders as words and picks the plural form', () => {
    expect(formatParts('{x} left', {})).toEqual([{ text: '{x} left' }]);
    expect(pluralParts(7, { one: '{n} pt', other: '{n} pts' })).toEqual([{ text: '7', param: 'n' }, { text: ' pts' }]);
    expect(pluralParts(1, { one: '{n} pt', other: '{n} pts' }).map((p) => p.text).join('')).toBe('1 pt');
  });
});
