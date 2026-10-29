import type { CharacterId, EditionId } from '@unspoken/core';

import type { SpotlightStep } from './en';

// Copy for Home and for UnspokenMD (home-v4). Part of the en catalog as en.home and en.md.

export const homeCopy = {
  // The switch at the top. Each edition's name, with UnspokenMD's "MD" set in the accent color.
  switchLabel: 'Edition',
  editions: {
    unspoken: { name: 'Unspoken', accent: '', sub: 'Everyday words' },
    md: { name: 'Unspoken', accent: 'MD', sub: 'Medical jargon' },
  } satisfies Record<EditionId, { name: string; accent: string; sub: string }>,
  // Under the fox-and-card art, one line each.
  tagline: {
    unspoken: ['Describe the word.', 'Don’t say the banned ones.'],
    md: ['Explain the term.', 'Skip the jargon.'],
  } satisfies Record<EditionId, readonly string[]>,
  // The art's text alternative.
  art: {
    unspoken: 'A fox holding a card that says unspoken',
    md: 'A fox holding a card that says unspokenmd',
  } satisfies Record<EditionId, string>,
  // Quick Play plays the last settings on this phone: "Endless · One phone · Normal".
  quickPlay: { title: 'Quick Play', detail: '{mode} · {where} · {difficulty}', onePhone: 'One phone' },
  links: { label: 'More', modes: 'Modes', customize: 'Customize', howToPlay: 'How to play' },
};

const characters: Record<CharacterId, string> = {
  heart: 'Heart',
  brain: 'Brain',
  lungs: 'Lungs',
  kidney: 'Kidney',
  stomach: 'Stomach',
  liver: 'Liver',
  tooth: 'Tooth',
  bone: 'Bone',
  drop: 'Drop',
  cell: 'Cell',
  dna: 'DNA',
  stethoscope: 'Stethoscope',
  medkit: 'Medkit',
  pill: 'Pill',
  bandage: 'Bandage',
  testtube: 'Test tube',
  flask: 'Flask',
  thermometer: 'Thermometer',
  mask: 'Mask',
};

// How to play in UnspokenMD: the same tour, with the MD wordmark and its own first step.
export function mdTourSteps(steps: readonly SpotlightStep[]): SpotlightStep[] {
  return steps.map((step) =>
    step.art === 'logo'
      ? { ...step, text: 'Get someone to guess a medical term without saying any of the banned jargon.', note: 'Talk the way you would to a patient.' }
      : step,
  );
}

export const mdCopy = {
  // "unspoken" in ink and "md" in the accent color, as on the fox card.
  wordmark: { base: 'unspoken', accent: 'md' },
  customize: {
    sub: 'Make UnspokenMD look the way you like.',
    layout: 'LAYOUT',
    look: 'LOOK',
    looks: { light: 'Light', dark: 'Dark', system: 'Phone setting' },
    noColor: 'UnspokenMD always uses its blue, so there’s no color choice here.',
    character: 'YOUR CHARACTER',
    characterAside: 'Shown in lobbies',
    characterNote: 'You can change it when you join',
    change: 'Change',
    pickerTitle: 'Pick your character',
    pickerNote: 'Friends see it in lobbies',
    done: 'Done',
  },
  characters,
};
