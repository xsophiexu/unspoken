import { describe, expect, it } from 'vitest';

import { cardSpokenTerms, findSpokenTerms, SpokenTermListener, type SpokenTerm } from '../src';

const banned = (...texts: string[]): SpokenTerm[] => texts.map((text) => ({ text, kind: 'banned' }));
const said = (text: string, ...terms: string[]) => findSpokenTerms(text, banned(...terms)).map((t) => t.text);

describe('spotting banned words in speech', () => {
  it('hears a banned word in a sentence, whatever its case or punctuation', () => {
    expect(said("It's the thing you do at the BEACH, okay?", 'Beach', 'Sand')).toEqual(['Beach']);
  });

  it('ignores words that only contain a banned word', () => {
    expect(said('turn at the corner, then the carpet store', 'Corn', 'Car')).toEqual([]);
  });

  it('counts plurals and simple verb forms as the same word', () => {
    expect(said('they found two polyps', 'Polyp')).toEqual(['Polyp']);
    expect(said('she was baking all day', 'Bake')).toEqual(['Bake']);
    expect(said('he ran because he was running late', 'Run')).toEqual(['Run']);
    expect(said('fresh berries', 'Berry')).toEqual(['Berry']);
    expect(said('a pile of boxes', 'Box')).toEqual(['Box']);
    expect(said('the clot might embolize', 'Embolize')).toEqual(['Embolize']);
    expect(said('it embolized', 'Embolize')).toEqual(['Embolize']);
  });

  it('hears a phrase only when its words come together', () => {
    expect(said('they took him to the cath labs', 'Cath lab')).toEqual(['Cath lab']);
    expect(said('the lab sent the cath kit', 'Cath lab')).toEqual([]);
    expect(said('his coronary artery was blocked', 'Coronary artery')).toEqual(['Coronary artery']);
  });

  it('hears abbreviations spelled out or joined', () => {
    expect(said('check his b p', 'BP')).toEqual(['BP']);
    expect(said('his BP is high', 'BP')).toEqual(['BP']);
    expect(said('an a 1 c of seven', 'A1c')).toEqual(['A1c']);
    expect(said('order a t four', 'T4')).toEqual(['T4']);
    expect(said('the cathlab is ready', 'Cath lab')).toEqual(['Cath lab']);
    expect(said('get some n s a i ds', 'NSAIDs')).toEqual(['NSAIDs']);
  });

  it('matches hyphens, possessives and accents loosely', () => {
    expect(said('relapsing remitting', 'Relapsing-remitting')).toEqual(['Relapsing-remitting']);
    expect(said('it is called hashimotos disease', "Hashimoto's")).toEqual(["Hashimoto's"]);
    expect(said('cafe', 'Café')).toEqual(['Café']);
  });

  it("listens for the card's own word as well as the banned words showing", () => {
    const terms = cardSpokenTerms({ word: 'Road trip', banned: ['Car', 'Drive'] });
    expect(findSpokenTerms('a long road trip in the car', terms)).toEqual([
      { text: 'Road trip', kind: 'word' },
      { text: 'Road', kind: 'word' },
      { text: 'trip', kind: 'word' },
      { text: 'Car', kind: 'banned' },
    ]);
  });

  it("hears one word of a card's longer word, but not its small linking words", () => {
    const terms = cardSpokenTerms({ word: 'Cardiac catheterization', banned: [] });
    expect(findSpokenTerms('it is a cardiac thing', terms)).toEqual([{ text: 'Cardiac', kind: 'word' }]);
    const rights = cardSpokenTerms({ word: 'Bill of rights', banned: [] });
    expect(findSpokenTerms('a list of freedoms', rights)).toEqual([]);
  });
});

describe('following a recognizer as it revises', () => {
  it('reports a word once while the same result is revised', () => {
    const listener = new SpokenTermListener(banned('Sand'));
    expect(listener.hear(0, 'you build castles with')).toEqual([]);
    expect(listener.hear(0, 'you build castles with sand')).toEqual(banned('Sand'));
    expect(listener.hear(0, 'you build castles with sand at the')).toEqual([]);
    expect(listener.hear(0, 'you build castles with sand at the beach')).toEqual([]);
  });

  it('reports a word again each time it is said again', () => {
    const listener = new SpokenTermListener(banned('Sand'));
    listener.hear(0, 'sand');
    expect(listener.hear(0, 'sand and more sand')).toEqual(banned('Sand'));
    expect(listener.hear(1, 'sand')).toEqual(banned('Sand'));
  });

  it('does not report again when a new result repeats the one before it', () => {
    const listener = new SpokenTermListener(banned('Sand'));
    expect(listener.hear(0, 'castles made of sand')).toEqual(banned('Sand'));
    expect(listener.hear(1, 'castles made of sand at the beach')).toEqual([]);
    expect(listener.hear(2, 'castles made of sand at the beach with more sand')).toEqual(banned('Sand'));
  });

  it('does not report again when a revision drops and restores a word', () => {
    const listener = new SpokenTermListener(banned('Sand'));
    listener.hear(0, 'sand castle');
    listener.hear(0, 'sound castle');
    expect(listener.hear(0, 'sand castle')).toEqual([]);
  });

  it('does not count talk about the last card against the next one', () => {
    const listener = new SpokenTermListener(banned('Sand'));
    listener.hear(0, 'you hear waves at the beach');
    listener.setTerms(banned('Waves'));
    expect(listener.hear(0, 'you hear waves at the beach')).toEqual([]);
    expect(listener.hear(0, 'you hear waves at the beach and the waves')).toEqual(banned('Waves'));
  });

  it('starts counting afresh when recognition restarts', () => {
    const listener = new SpokenTermListener(banned('Sand'));
    listener.hear(0, 'sand');
    listener.restart();
    expect(listener.hear(0, 'sand')).toEqual(banned('Sand'));
  });
});
