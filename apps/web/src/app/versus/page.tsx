import { ClientOnly } from '@/lib/ClientOnly';
import { MindReaderPlayersScreen } from '@/screens/mindReader/PlayersScreen';

// Versus, step 1: who's playing (opened from its tile on Modes).
export default function VersusPlayersPage() {
  return (
    <ClientOnly>
      <MindReaderPlayersScreen game="versus" />
    </ClientOnly>
  );
}
