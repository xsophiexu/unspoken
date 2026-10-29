import { ALL_DIFFICULTY_IDS, normalizeBank, SPECIALTY_IDS, type BankCardInput, type BankEntry, type Difficulty, type MdModeId, type RoundCopy, type Specialty } from '@unspoken/core';

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

// Short names where space is tight (the line under the game's title: "GI · 2 correct · 1 skipped").
const specialtyShort: Record<Specialty, string> = {
  cardiovascular: 'Cardio',
  respiratory: 'Resp',
  gastrointestinal: 'GI',
  renal: 'Renal',
  endocrine: 'Endo',
  reproductive: 'Repro',
  neurology: 'Neuro',
  psychiatry: 'Psych',
  hematologyOncology: 'Heme/Onc',
  musculoskeletalSkin: 'MSK/Skin',
  immunology: 'Immuno',
  infectiousDisease: 'ID',
  biochemistryGenetics: 'Biochem/Genetics',
};

// Each specialty on the game's chip, which holds config.badgeMaxChars (11) characters at most
// (Deep dive's chip: "CARDIO").
const specialtyBadge: Record<Specialty, string> = { ...specialtyShort, biochemistryGenetics: 'Biochem' };

const edition = en.home.editions.md;

// The Difficulty info table's examples: the first card of a specialty at each difficulty, for three
// specialties. MD has no Easy cards, so Easy stays blank.
const exampleSpecialties: readonly Specialty[] = ['cardiovascular', 'respiratory', 'neurology'];
const difficultyExamples = exampleSpecialties.map((id) => ({
  category: specialties[id],
  words: Object.fromEntries(ALL_DIFFICULTY_IDS.map((d) => [d, mdBank.find((c) => c.specialty === id && c.difficulty === d)?.word ?? ''])) as Record<Difficulty, string>,
}));

// English copy for UnspokenMD: what only it says. Everything else comes from the shared catalog (en).
export const mdEn = {
  edition: { name: `${edition.name}${edition.accent}`, sub: edition.sub },
  // UnspokenMD's modes (home-v4, screen 3), two lines each. Zen and Ladder are only MD's, so their
  // wording lives once in en.modes; Versus plays as Unspoken's, with MD's line.
  modes: {
    zen: en.modes.zen,
    versus: { name: en.modes.versus.name, sub: 'Teams or free-for-all. Points per term.' },
    ladder: en.modes.ladder,
  } satisfies Record<MdModeId, { name: string; sub: string }>,
  specialties,
  specialtyShort,
  specialtyBadge,
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
  // New game in UnspokenMD: the Specialties box in place of Categories, and the rules' label.
  setup: {
    specialties: 'Specialties',
    optionalRules: 'OPTIONAL RULES',
    smallDeckBody: 'Cards are likely to repeat. Try adding specialties or difficulties.',
  },
  // The (i) at the right of DIFFICULTY.
  difficultyInfo: {
    title: en.difficultyInfo.title,
    body: 'Tap to select one or more difficulties. The examples below show the same specialty at each difficulty.',
    examples: difficultyExamples,
  },
  // The pull-up sheet from the Specialties box, like Choose categories.
  specialtiesSheet: {
    title: 'Choose specialties',
    hint: 'Double-tap All specialties to highlight all',
    hintAll: 'Double-tap All specialties to unhighlight all',
    done: 'Done',
  },
  // Deep dive: one specialty in place of one category.
  deepDive: { ...en.deepDive, pickOne: 'Pick one specialty.', listLabel: 'Specialties' },
  // The game screen (quick-play-2).
  play: {
    // A Zen game's header when Home's Quick Play started it (from setup it says Zen). The chip
    // beside it names only the difficulty; the line under it names the word bank.
    title: en.home.quickPlay.title,
    bannedLabel: 'BANNED JARGON',
    // In place of "Your word" on a card picked from search.
    fromSearch: 'From search · {difficulty} · {specialty}',
    search: 'Find a card',
  },
  // The chip's sheet: Difficulty | Specialties tabs, Custom settings and Apply.
  picksSheet: {
    tabs: 'Word bank',
    difficulty: 'Difficulty',
    specialties: 'Specialties',
    specialtiesLabel: 'SPECIALTIES',
    note: 'Applying starts a new game',
    custom: 'Custom settings',
    apply: 'Apply',
  },
  // Find a card: every UnspokenMD card, at any difficulty.
  search: {
    title: 'Find a card',
    note: 'Searches every UnspokenMD card',
    label: 'Search terms',
    placeholder: 'Type part of a term',
    // A result's second line.
    detail: '{difficulty} · {specialty}',
    // "Pneumothorax, Tough, Respiratory. Play it next."
    resultLabel: '{word}, {difficulty}, {specialty}. Play it next.',
    none: 'No terms match',
    // When more cards match than the list shows.
    more: 'Showing the first {shown}. Type more to narrow it down.',
  },
  // The Game paused sheet.
  menu: {
    changeSettings: 'Mode, difficulty and specialties · starts a new game',
    feedback: 'Ideas for modes or terms',
    customize: 'Layout and look · {style} · {look}',
  },
  a11y: {
    specialties: 'Specialties: {summary}. Tap to choose.',
    picks: 'Difficulty {difficulty}, {specialties}. Tap to change.',
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
