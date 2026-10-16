'use client';

import { useSearchParams } from 'next/navigation';

import { ClientOnly } from '@/lib/ClientOnly';
import { parseEntryPoint } from '@/lib/routes';
import { ThanksScreen } from '@/screens/ThanksScreen';

function ThanksRoute() {
  return <ThanksScreen from={parseEntryPoint(useSearchParams().get('from'))} />;
}

export default function ThanksPage() {
  return (
    <ClientOnly>
      <ThanksRoute />
    </ClientOnly>
  );
}
