'use client';

import { useSearchParams } from 'next/navigation';

import { ClientOnly } from '@/lib/ClientOnly';
import { PlayScreen } from '@/screens/PlayScreen';

function PlayRoute() {
  // How to play on Home opens the game with the tour over it.
  return <PlayScreen tour={useSearchParams().get('tour') === '1'} />;
}

export default function PlayPage() {
  return (
    <ClientOnly>
      <PlayRoute />
    </ClientOnly>
  );
}
