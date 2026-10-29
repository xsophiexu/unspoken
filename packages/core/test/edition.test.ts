import { describe, expect, it } from 'vitest';

import { CHARACTER_IDS, DEFAULT_CHARACTER, DEFAULT_EDITION, parseCharacter, parseEdition } from '../src';

describe('saved edition', () => {
  it('reads back a known edition', () => {
    expect(parseEdition('md')).toBe('md');
    expect(parseEdition('unspoken')).toBe('unspoken');
  });

  it('falls back to Unspoken for anything else', () => {
    for (const value of [undefined, null, 'MD', 3, {}]) expect(parseEdition(value)).toBe(DEFAULT_EDITION);
    expect(DEFAULT_EDITION).toBe('unspoken');
  });
});

describe('saved character', () => {
  it('reads back any of the 19 characters', () => {
    expect(CHARACTER_IDS).toHaveLength(19);
    expect(parseCharacter('kidney')).toBe('kidney');
  });

  it('falls back to the first character for anything else', () => {
    expect(parseCharacter('dragon')).toBe(DEFAULT_CHARACTER);
    expect(parseCharacter(undefined)).toBe(DEFAULT_CHARACTER);
  });
});
