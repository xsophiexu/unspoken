import { seededRandom } from '@unspoken/core';
import { render } from '@testing-library/react';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { GameProvider } from '@/state/game';
import { ThemeProvider } from '@/state/theme';

// Test harness: the app's providers around a screen, with the navigation boundary faked (a router
// that records where it was sent) and dealing seeded so every run sees the same cards.

export function fakeRouter() {
  return {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    bfcacheId: 'test',
  } satisfies AppRouterInstance;
}

export function renderApp(ui: ReactNode, { router = fakeRouter(), seed = 1 } = {}) {
  const random = seededRandom(seed).random;
  const result = render(
    <AppRouterContext value={router}>
      <ThemeProvider>
        <GameProvider random={random}>{ui}</GameProvider>
      </ThemeProvider>
    </AppRouterContext>,
  );
  return { router, ...result };
}

// What a returning player has saved (the storage boundary).
export function saved(entries: Record<string, unknown>) {
  for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value));
}
