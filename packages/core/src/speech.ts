// Spotting a card's banned words in speech. The platform turns the clue giver's voice into text
// (on the device where it can); this decides whether that text says the card's word or one of its
// banned words. Pure text matching, so it runs the same everywhere and never sees audio.

// What a term on the card is: the card's own word, or one of the banned words showing.
export type SpokenTermKind = 'word' | 'banned';

export type SpokenTerm = { text: string; kind: SpokenTermKind };

// A term heard in speech.
export type SpokenHit = SpokenTerm;

// Recognizers spell small numbers either way ("T four", "T4"), so both sides use digits.
const NUMBER_WORDS: Readonly<Record<string, string>> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18',
  nineteen: '19', twenty: '20',
};

// Lowercase words without accents, apostrophes or possessives. Hyphens and other punctuation split
// words, so "Relapsing-remitting" and "relapsing remitting" read the same.
export function speechTokens(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]s\b/g, '')
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => NUMBER_WORDS[token] ?? token);
}

const DOUBLED_END = /([b-df-hj-km-rt-z])\1$/;

// A light stem so plurals and simple verb forms count as the same word: polyps/polyp,
// berries/berry, baking/baked/bake, running/run. It leaves -er and -est alone because those make
// different words too often (corner is not corn).
export function speechStem(token: string): string {
  if (token.length <= 3 || /\d/.test(token)) return token;
  let s = token;
  if (s.endsWith('ies') && s.length > 4) s = `${s.slice(0, -3)}y`;
  else if (/(ss|x|z|ch|sh)es$/.test(s)) s = s.slice(0, -2);
  else if (s.endsWith('s') && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);
  for (const suffix of ['ing', 'ed']) {
    if (s.endsWith(suffix) && s.length - suffix.length >= 3) {
      s = s.slice(0, -suffix.length);
      if (DOUBLED_END.test(s)) s = s.slice(0, -1);
      break;
    }
  }
  return s.replace(/i$/, 'y').replace(/e$/, '');
}

// How many words of speech one term can span when spoken spelled out ("b p", "a 1 c").
const MAX_SPELLED = 6;

type Prepared = { term: SpokenTerm; stems: string[]; compact: string };

function prepare(term: SpokenTerm): Prepared | null {
  const tokens = speechTokens(term.text);
  if (tokens.length === 0) return null;
  return { term, stems: tokens.map(speechStem), compact: tokens.join('') };
}

// How many times the speech says the term. A term matches its words in order with any plural or
// verb form ("cath labs" for Cath lab), or the same letters split or joined differently ("b p"
// for BP, "cathlab" for Cath lab, "T 4" for T4).
function occurrences(p: Prepared, tokens: readonly string[], stems: readonly string[]): number {
  let n = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (p.stems.every((stem, k) => stems[i + k] === stem)) {
      n++;
      i += p.stems.length - 1;
      continue;
    }
    let joined = '';
    for (let k = i; k < tokens.length && k - i < Math.max(MAX_SPELLED, p.stems.length + 1); k++) {
      joined += tokens[k];
      if (joined.length > p.compact.length + 1) break;
      // A match on one word is the stem check's job; this is for words split or joined differently.
      const span = k - i + 1;
      if (span !== p.stems.length && (joined === p.compact || joined === `${p.compact}s`)) {
        n++;
        i = k;
        break;
      }
    }
  }
  return n;
}

function countAll(prepared: readonly Prepared[], text: string): Map<string, number> {
  const tokens = speechTokens(text);
  const stems = tokens.map(speechStem);
  const counts = new Map<string, number>();
  for (const p of prepared) {
    const n = occurrences(p, tokens, stems);
    if (n > 0) counts.set(p.term.text, n);
  }
  return counts;
}

// The terms a piece of speech says, in card order.
export function findSpokenTerms(text: string, terms: readonly SpokenTerm[]): SpokenHit[] {
  const prepared = terms.map(prepare).filter((p): p is Prepared => p !== null);
  const counts = countAll(prepared, text);
  return prepared.filter((p) => counts.has(p.term.text)).map((p) => p.term);
}

// The terms to listen for on a card: its word, then the banned words showing.
export function cardSpokenTerms(card: { word: string; banned: readonly string[] }): SpokenTerm[] {
  return [{ text: card.word, kind: 'word' }, ...card.banned.map((text) => ({ text, kind: 'banned' as const }))];
}

// Follows a recognizer's running results and reports each new time a term is said, once. Speech
// recognizers send numbered results that are revised while someone talks (interim) and then fixed
// (final), so a result can arrive many times; only a rise in a term's count is new. Changing the
// card counts what was already said as heard, so talk about the last card never sets off the next.
export class SpokenTermListener {
  private prepared: Prepared[] = [];
  private readonly heard = new Map<number, { text: string; counts: Map<string, number> }>();

  constructor(terms: readonly SpokenTerm[] = []) {
    this.setTerms(terms);
  }

  setTerms(terms: readonly SpokenTerm[]): void {
    this.prepared = terms.map(prepare).filter((p): p is Prepared => p !== null);
    for (const entry of this.heard.values()) entry.counts = countAll(this.prepared, entry.text);
  }

  // The latest text of result `index`. Returns the terms said since this result was last seen.
  hear(index: number, text: string): SpokenHit[] {
    const before = this.heard.get(index)?.counts ?? new Map<string, number>();
    const counts = countAll(this.prepared, text);
    // A revision can drop a word the recognizer misheard; keep the higher count so it can't fire twice.
    for (const [term, n] of before) if ((counts.get(term) ?? 0) < n) counts.set(term, n);
    this.heard.set(index, { text, counts });
    return this.prepared.filter((p) => (counts.get(p.term.text) ?? 0) > (before.get(p.term.text) ?? 0)).map((p) => p.term);
  }

  // A new recognition session numbers its results from 0 again.
  restart(): void {
    this.heard.clear();
  }
}
