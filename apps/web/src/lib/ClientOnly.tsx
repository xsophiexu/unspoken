'use client';

import { Suspense, type ReactNode } from 'react';

import { useHydrated } from './hooks';

// Screens depend on saved choices (localStorage) and a random deal, so the static HTML is an empty
// shell and the screen renders once the page is running in the browser. Suspense lets screens read
// the query string (useSearchParams) in a static export.
export function ClientOnly({ children }: { children: ReactNode }) {
  return useHydrated() ? <Suspense>{children}</Suspense> : null;
}
