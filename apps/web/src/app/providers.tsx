'use client';

import type { ReactNode } from 'react';

import { EditionProvider } from '@/state/edition';
import { GameProvider } from '@/state/game';
import { ThemeProvider } from '@/state/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <EditionProvider>
      <ThemeProvider>
        <GameProvider>{children}</GameProvider>
      </ThemeProvider>
    </EditionProvider>
  );
}
