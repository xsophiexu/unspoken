import { ClientOnly } from '@/lib/ClientOnly';
import { MindReaderLineupScreen } from '@/screens/mindReader/LineupScreen';

// Versus, step 2: Individual or Teams, the turn order or the teams.
export default function VersusLineupPage() {
  return (
    <ClientOnly>
      <MindReaderLineupScreen game="versus" />
    </ClientOnly>
  );
}
