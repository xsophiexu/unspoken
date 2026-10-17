import { ClientOnly } from '@/lib/ClientOnly';
import { MindReaderLineupScreen } from '@/screens/mindReader/LineupScreen';

export default function MindReaderLineupPage() {
  return (
    <ClientOnly>
      <MindReaderLineupScreen />
    </ClientOnly>
  );
}
