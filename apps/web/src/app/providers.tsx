'use client';

import type { ReactNode } from 'react';

import { GameProvider } from '@/state/game';
import { ThemeProvider } from '@/state/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <GameProvider>{children}</GameProvider>
    </ThemeProvider>
  );
}
