'use client';

import { useSearchParams } from 'next/navigation';

import { ClientOnly } from '@/lib/ClientOnly';
import { parseEntryPoint } from '@/lib/routes';
import { FeedbackScreen } from '@/screens/FeedbackScreen';

function FeedbackRoute() {
  const from = parseEntryPoint(useSearchParams().get('from'));
  return <FeedbackScreen key={from} from={from} />;
}

export default function FeedbackPage() {
  return (
    <ClientOnly>
      <FeedbackRoute />
    </ClientOnly>
  );
}
