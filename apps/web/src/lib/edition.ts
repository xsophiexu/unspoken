import { DEFAULT_EDITION, parseCharacter, parseEdition, type CharacterId, type EditionId } from '@unspoken/core';
import { LOOK_IDS, editionLooks, type LookId } from '@unspoken/design-tokens';
import { z } from 'zod';

// Where the edition choices are saved: which edition is on, UnspokenMD's own Look (light, dark or
// the phone's setting) and the player's character. Read by the inline boot script before first
// paint (theme/boot.ts) and by the edition provider after hydration.
export const EDITION_STORAGE_KEY = 'unspoken.edition';

export type EditionPrefs = { edition: EditionId; look: LookId; character: CharacterId };

const defaultLook: LookId = editionLooks.md.defaultLook ?? LOOK_IDS[0];

export const DEFAULT_EDITION_PREFS: EditionPrefs = { edition: DEFAULT_EDITION, look: defaultLook, character: parseCharacter(undefined) };

// Reads saved edition choices, keeping each valid field and defaulting the rest.
export function parseEditionPrefs(value: unknown): EditionPrefs {
  const schema = z.object({
    edition: z.unknown().optional().transform(parseEdition),
    look: z.enum(LOOK_IDS).catch(defaultLook),
    character: z.unknown().optional().transform(parseCharacter),
  });
  return schema.parse(typeof value === 'object' && value !== null ? value : {});
}
