'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { ClientOnly } from '@/lib/ClientOnly';
import { parseMode, routes } from '@/lib/routes';
import { SetupScreen } from '@/screens/SetupScreen';

function SetupRoute() {
  const mode = parseMode(useSearchParams().get('mode'));
  const router = useRouter();
  // A missing or unavailable mode goes back to the list.
  useEffect(() => {
    if (!mode) router.replace(routes.modes);
  }, [mode, router]);
  return mode && <SetupScreen key={mode} mode={mode} />;
}

export default function SetupPage() {
  return (
    <ClientOnly>
      <SetupRoute />
    </ClientOnly>
  );
}
