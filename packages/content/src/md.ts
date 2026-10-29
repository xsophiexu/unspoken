import { normalizeBank, SPECIALTY_IDS, type BankCardInput, type BankEntry, type MdModeId, type RoundCopy, type Specialty } from '@unspoken/core';

import mdRaw from '../data/md.json';
import { en } from './en';

// UnspokenMD: its cards and the copy only it uses. Everything else comes from the shared catalog.

// The MD bank: 1,021 Step 1 cards from /mnt/project-files/unspoken/medical/step1-jargon-cards.md
// (owned by the Words thread), each with 6 banned terms, a difficulty and a specialty. Rebuild
// data/md.json with `pnpm --filter @unspoken/content build:md` after the file changes. Banned terms
// keep their case (p-ANCA, hCG). Ready for cardsForSpecialties, cardsForSettings, dealFromBank (with
// `specialties`) and searchCards from @unspoken/core.
export const mdBank: readonly BankEntry[] = normalizeBank(mdRaw as BankCardInput[], { keepCase: true });

// Specialty names, as the card file's headings write them.
const specialties: Record<Specialty, string> = {
  cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratory',
  gastrointestinal: 'Gastrointestinal',
  renal: 'Renal',
  endocrine: 'Endocrine',
  reproductive: 'Reproductive',
  neurology: 'Neurology',
  psychiatry: 'Psychiatry',
  hematologyOncology: 'Hematology and Oncology',
  musculoskeletalSkin: 'Musculoskeletal and Skin',
  immunology: 'Immunology',
  infectiousDisease: 'Infectious disease',
  biochemistryGenetics: 'Biochemistry and Genetics',
};

// English copy for UnspokenMD.
export const mdEn = {
  edition: { name: 'UnspokenMD', sub: 'Medical jargon' },
  modes: {
    zen: en.modes.zen,
    versus: { name: en.modes.versus.name, sub: 'Teams or free-for-all. Points per term.' },
    ladder: en.modes.ladder,
  } satisfies Record<MdModeId, { name: string; sub: string }>,
  specialties,
  // The Specialties row and chips: like the categories' All cards and "{n} categories".
  specialtyPicks: { all: 'All specialties', many: { one: '{n} specialty', other: '{n} specialties' } },
  units: {
    bannedTerms: { one: '{n} banned term', other: '{n} banned terms' },
  },
  // Zen's optional rules on setup, each a switch with its line when off and when on.
  zenRules: {
    timer: { title: 'Timer', off: 'No time limit', on: 'The game ends when time runs out' },
    skipLimit: { title: 'Skip limit', off: 'Unlimited skips', on: 'Skipping stops when you run out', stepper: 'Skips for the game' },
    scoreTarget: { title: 'Play to a score', off: 'No score to reach', on: 'The game ends when you reach it', stepper: 'Correct to win' },
  },
};

// The status lines' copy for an MD round: specialties in place of categories, and banned terms.
export const mdRoundCopy: RoundCopy = {
  ...en,
  specialties,
  themes: mdEn.specialtyPicks,
  units: { ...en.units, bannedWords: mdEn.units.bannedTerms },
};

// The Choose specialties sheet's chips: every specialty in the card file's order, with its name
// and how many MD cards it has at any difficulty.
export const mdSpecialties: readonly { id: Specialty; name: string; cards: number }[] = SPECIALTY_IDS.map((id) => ({
  id,
  name: specialties[id],
  cards: mdBank.filter((c) => c.specialty === id).length,
}));
