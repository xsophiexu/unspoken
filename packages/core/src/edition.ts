import { EDITION_IDS, type Difficulty, type Edition } from './types';

// The two editions the app switches between on Home: Unspoken (everyday words) and UnspokenMD
// (medical terms with banned jargon). Switching changes the cards, the modes and the look.
// The ids themselves (EDITION_IDS, Edition) live in ./types.
export type EditionId = Edition;

export const DEFAULT_EDITION: EditionId = 'unspoken';

// A saved edition, or the default for anything unknown.
export function parseEdition(value: unknown): EditionId {
  return EDITION_IDS.find((id) => id === value) ?? DEFAULT_EDITION;
}

// The player characters (UnspokenMD): one per drawing in the design's characters folder, in the
// order the picker shows them. Lobbies show each player as their character.
export const CHARACTER_IDS = [
  'heart',
  'brain',
  'lungs',
  'kidney',
  'stomach',
  'liver',
  'tooth',
  'bone',
  'drop',
  'cell',
  'dna',
  'stethoscope',
  'medkit',
  'pill',
  'bandage',
  'testtube',
  'flask',
  'thermometer',
  'mask',
] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export const DEFAULT_CHARACTER: CharacterId = CHARACTER_IDS[0];

// A saved character, or the default for anything unknown.
export function parseCharacter(value: unknown): CharacterId {
  return CHARACTER_IDS.find((id) => id === value) ?? DEFAULT_CHARACTER;
}

// What UnspokenMD's Quick Play starts until a game has been set up: Zen at Tricky (home-v4,
// screen 2). Zen is UnspokenMD's own mode, so it is not one of MODE_IDS.
export const MD_QUICK_PLAY_DEFAULTS: { mode: 'zen'; difficulty: Difficulty } = { mode: 'zen', difficulty: 'Tricky' };
