import { describe, expect, it } from 'vitest';

import { gameConfig } from '@unspoken/core';

import { en, mdEn } from '../src';

describe('How to play in UnspokenMD', () => {
  it('tours the same steps, opening on its own first step, with the chip changing difficulty and specialties', () => {
    const [first, ...rest] = en.md.howToPlay.steps;
    const [unspokenFirst, ...unspokenRest] = en.howToPlay.steps;
    expect(rest.map((step) => step.id)).toEqual(unspokenRest.map((step) => step.id));
    expect(rest.filter((step) => step.target !== 'difficulty')).toEqual(unspokenRest.filter((step) => step.target !== 'difficulty'));
    expect(rest.find((step) => step.target === 'difficulty')?.text).toBe('Tap here to change the difficulty and the specialties.');
    expect(first).toEqual({
      ...unspokenFirst,
      text: 'Get someone to guess a medical term without saying any of the banned jargon.',
      note: 'Talk the way you would to a patient.',
    });
  });
});

describe('Chip names', () => {
  it('fits every category and specialty on the 11-character chip, unless the full name is kept', () => {
    const pairs = [
      ...Object.entries(en.categoryBadge).map(([id, badge]) => [badge, en.categories[id as keyof typeof en.categories]] as const),
      ...Object.entries(mdEn.specialtyBadge).map(([id, badge]) => [badge, mdEn.specialties[id as keyof typeof mdEn.specialties]] as const),
    ];
    expect(pairs.filter(([badge, name]) => badge.length > gameConfig.badgeMaxChars && badge !== name)).toEqual([]);
  });
});
