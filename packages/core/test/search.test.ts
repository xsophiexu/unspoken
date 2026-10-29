import { describe, expect, it } from 'vitest';

import { cardById, mdGameConfig, normalizeBank, searchCards, type BankCardInput } from '../src';

const card = (word: string, difficulty: BankCardInput['difficulty'], specialty?: BankCardInput['specialty']): BankCardInput => ({
  word,
  difficulty,
  specialty,
  banned: ['A', 'B', 'C', 'D', 'E', 'F'],
});

const bank = normalizeBank([
  card('Pneumocystis pneumonia', 'Legend', 'infectiousDisease'),
  card('Walking pneumonia', 'Tough', 'respiratory'),
  card('Coal workers’ pneumoconiosis', 'Master', 'respiratory'),
  card('Pneumothorax', 'Tough', 'respiratory'),
  card('Pneumonia', 'Tricky', 'respiratory'),
  card('Hypersensitivity pneumonitis', 'Master', 'respiratory'),
  card('Müllerian agenesis', 'Legend', 'reproductive'),
  card('Sjögren syndrome', 'Elite', 'immunology'),
  card('Ankylosing spondylitis', 'Expert', 'musculoskeletalSkin'),
]);

const words = (query: string) => searchCards(bank, query, mdGameConfig).map((r) => r.word);

describe('searchCards', () => {
  it('ranks cards starting with the query first, then later words starting with it, easiest first', () => {
    expect(words('pneu')).toEqual([
      'Pneumonia',
      'Pneumothorax',
      'Pneumocystis pneumonia',
      'Walking pneumonia',
      'Coal workers’ pneumoconiosis',
      'Hypersensitivity pneumonitis',
    ]);
  });

  it('finds the query inside a word after word starts', () => {
    expect(words('ondyl')).toEqual(['Ankylosing spondylitis']);
    expect(words('monia')).toEqual(['Pneumonia', 'Walking pneumonia', 'Pneumocystis pneumonia']);
  });

  it('ignores case and accents in both the query and the word', () => {
    expect(words('MULLERIAN')).toEqual(['Müllerian agenesis']);
    expect(words('sjögren')).toEqual(['Sjögren syndrome']);
    expect(words('Sjogren')).toEqual(['Sjögren syndrome']);
  });

  it('returns each card’s difficulty and specialty, and where the match is for highlighting', () => {
    const [result] = searchCards(bank, ' walking pneu ', mdGameConfig);
    expect(result).toMatchObject({ word: 'Walking pneumonia', difficulty: 'Tough', specialty: 'respiratory' });
    expect(result!.word.slice(result!.match.start, result!.match.start + result!.match.length)).toBe('Walking pneu');
  });

  it('highlights the word as written when it has accents', () => {
    const [result] = searchCards(bank, 'mull', mdGameConfig);
    expect(result!.word.slice(result!.match.start, result!.match.start + result!.match.length)).toBe('Müll');
  });

  it('finds nothing for a blank query or a word no card has', () => {
    expect(words('   ')).toEqual([]);
    expect(words('zebra')).toEqual([]);
  });

  it('gives back the playable card for a result', () => {
    const [result] = searchCards(bank, 'pneumothorax', mdGameConfig);
    expect(cardById(bank, result!.id)).toEqual({ id: result!.id, word: 'Pneumothorax', banned: ['A', 'B', 'C', 'D', 'E', 'F'] });
    expect(cardById(bank, 'missing')).toBeUndefined();
  });
});
