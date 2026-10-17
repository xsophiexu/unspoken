import { ClientOnly } from '@/lib/ClientOnly';
import { MindReaderPlayersScreen } from '@/screens/mindReader/PlayersScreen';

export default function MindReaderPlayersPage() {
  return (
    <ClientOnly>
      <MindReaderPlayersScreen />
    </ClientOnly>
  );
}
