'use client';

import { createContext, useContext, type ReactNode } from 'react';

// What Hot Mic adds to the play screen, for the slot components to place: the listening pill under
// the word, and how many times each banned word on the card has been heard (the chip lights up and
// shakes again with each one). Absent outside Hot Mic, so every other mode renders as before.
export type HotMicMarks = { pill: ReactNode; heard: ReadonlyMap<string, number> };

export const HotMicContext = createContext<HotMicMarks | null>(null);

export function useHotMicMarks(): HotMicMarks | null {
  return useContext(HotMicContext);
}
