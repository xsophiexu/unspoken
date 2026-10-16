import { ClientOnly } from '@/lib/ClientOnly';
import { PlayScreen } from '@/screens/PlayScreen';

export default function PlayPage() {
  return (
    <ClientOnly>
      <PlayScreen />
    </ClientOnly>
  );
}
