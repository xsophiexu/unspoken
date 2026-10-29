'use client';

import type { CharacterId, EditionId } from '@unspoken/core';
import type { LookId } from '@unspoken/design-tokens';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { EDITION_STORAGE_KEY, parseEditionPrefs, type EditionPrefs } from '@/lib/edition';
import { readStored, writeStored } from '@/lib/storage';

type EditionContextValue = EditionPrefs & {
  setEdition: (edition: EditionId) => void;
  // UnspokenMD's Look on its Customize.
  setLook: (look: LookId) => void;
  // UnspokenMD's character on its Customize; lobbies show it.
  setCharacter: (character: CharacterId) => void;
};

const EditionContext = createContext<EditionContextValue | null>(null);

// Which edition the app is in (Unspoken or UnspokenMD) and UnspokenMD's own choices. Saved in
// localStorage; the theme provider reads it to switch the whole app's look.
export function EditionProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(() => parseEditionPrefs(readStored(EDITION_STORAGE_KEY)));

  useEffect(() => writeStored(EDITION_STORAGE_KEY, prefs), [prefs]);

  const change = useCallback((next: Partial<EditionPrefs>) => setPrefs((current) => ({ ...current, ...next })), []);
  const value = useMemo(
    () => ({
      ...prefs,
      setEdition: (edition: EditionId) => change({ edition }),
      setLook: (look: LookId) => change({ look }),
      setCharacter: (character: CharacterId) => change({ character }),
    }),
    [prefs, change],
  );
  return <EditionContext value={value}>{children}</EditionContext>;
}

export function useEdition(): EditionContextValue {
  const value = use(EditionContext);
  if (!value) throw new Error('useEdition needs an EditionProvider');
  return value;
}
