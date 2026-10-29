// Find a card: search a bank by card word, at any difficulty. Matching ignores case and accents
// ("cafe" finds Café). Cards whose word starts with the query come first, then cards with a later
// word starting with it ("pneu" → Walking pneumonia), then cards with it anywhere else. Within each,
// easiest difficulty first, then A to Z.

import { gameConfig, type GameConfig } from './config';
import type { BankEntry, Card, Difficulty, Specialty } from './types';

export type CardSearchResult = {
  id: string;
  word: string;
  difficulty: Difficulty;
  // UnspokenMD cards; undefined for Unspoken cards.
  specialty?: Specialty;
  // Where the query sits in the word, in the word's own characters, for highlighting.
  match: { start: number; length: number };
};

// Lowercase without accents, with each folded character's index in the original text, so a match
// in the folded text maps back to the word as written.
function fold(text: string): { text: string; from: number[] } {
  let out = '';
  const from: number[] = [];
  let i = 0;
  for (const ch of text) {
    const folded = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (const c of folded) {
      out += c;
      from.push(i);
    }
    i += ch.length;
  }
  from.push(i);
  return { text: out, from };
}

// 0: the word starts with the query; 1: a later word does; 2: it's elsewhere in a word.
function rank(word: string, at: number): number {
  if (at === 0) return 0;
  return /[\p{L}\p{N}]/u.test(word.charAt(at - 1)) ? 2 : 1;
}

// The query's first match in a folded word, preferring a word start.
function firstMatch(word: string, query: string): number {
  let best = -1;
  for (let at = word.indexOf(query); at >= 0; at = word.indexOf(query, at + 1)) {
    if (rank(word, at) < 2) return at;
    if (best < 0) best = at;
  }
  return best;
}

// Every card whose word contains the query, best matches first. A blank query finds nothing.
export function searchCards(bank: readonly BankEntry[], query: string, config: GameConfig = gameConfig): CardSearchResult[] {
  const q = fold(query.trim()).text;
  if (!q) return [];
  const order = (d: Difficulty) => config.difficulties.findIndex((r) => r.id === d);
  const found: (CardSearchResult & { rank: number })[] = [];
  for (const card of bank) {
    const word = fold(card.word);
    const at = firstMatch(word.text, q);
    if (at < 0) continue;
    const start = word.from[at] as number;
    const end = word.from[at + q.length] as number;
    const result: CardSearchResult & { rank: number } = { id: card.id, word: card.word, difficulty: card.difficulty, match: { start, length: end - start }, rank: rank(word.text, at) };
    if (card.specialty) result.specialty = card.specialty;
    found.push(result);
  }
  found.sort((a, b) => a.rank - b.rank || order(a.difficulty) - order(b.difficulty) || a.word.localeCompare(b.word));
  return found.map(({ rank: _rank, ...result }) => result);
}

// The playable card for a search result (to play it next with the round's showCard action).
export function cardById(bank: readonly BankEntry[], id: string): Card | undefined {
  const found = bank.find((c) => c.id === id);
  return found && { id: found.id, word: found.word, banned: found.banned };
}
