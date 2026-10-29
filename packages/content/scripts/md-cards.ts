/// <reference types="node" />
// Builds data/md.json, UnspokenMD's cards, from the Words thread's card file:
//
//   node packages/content/scripts/md-cards.ts [source.md] [out.json]
//
// The source defaults to /mnt/project-files/unspoken/medical/step1-jargon-cards.md. Each `## Specialty`
// heading has a table `| Card | Difficulty | Banned |` whose banned terms are separated by ", " (a
// comma with no space stays inside a term, as in 45,XO). Cards keep the file's order.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type MdCardRow = { word: string; difficulty: string; specialty: string; banned: string[] };

// A specialty heading's id: camelCase without "and" ("Hematology and Oncology" → hematologyOncology).
export function specialtyId(heading: string): string {
  const words = heading
    .split(/\s+/)
    .filter((w) => w && w.toLowerCase() !== 'and')
    .map((w) => w.toLowerCase());
  return words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
}

// Every card row under a `##` heading, with the heading it sits under. Other tables (the counts
// table at the top) and the header and divider rows are skipped.
export function parseMdCards(markdown: string): { headings: string[]; cards: MdCardRow[] } {
  const headings: string[] = [];
  const cards: MdCardRow[] = [];
  let heading: string | null = null;
  let inCardTable = false;
  for (const line of markdown.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      heading = h[1] as string;
      headings.push(heading);
      inCardTable = false;
      continue;
    }
    if (!line.startsWith('|')) {
      inCardTable = false;
      continue;
    }
    const cells = line.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
    if (cells[0] === 'Card' && cells[1] === 'Difficulty' && cells[2] === 'Banned') {
      inCardTable = true;
      continue;
    }
    if (!inCardTable || heading === null || cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const [word = '', difficulty = '', banned = ''] = cells;
    cards.push({ word, difficulty, specialty: specialtyId(heading), banned: banned.split(/,\s+/).map((b) => b.trim()) });
  }
  return { headings, cards };
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = process.argv[2] ?? '/mnt/project-files/unspoken/medical/step1-jargon-cards.md';
  const out = process.argv[3] ?? resolve(here, '../data/md.json');
  const { headings, cards } = parseMdCards(readFileSync(source, 'utf8'));
  writeFileSync(out, `${JSON.stringify(cards, null, 1)}\n`);
  console.log(`${cards.length} cards in ${headings.length} specialties → ${out}`);
}
