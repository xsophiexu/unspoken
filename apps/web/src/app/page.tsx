'use client';

import { PlayScreen } from '@/screens/PlayScreen';
import { useHydrated } from '@/lib/hooks';

export default function PlayPage() {
  return useHydrated() ? <PlayScreen /> : null;
}
