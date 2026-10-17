import { ClientOnly } from '@/lib/ClientOnly';
import { MindReaderStartScreen } from '@/screens/mindReader/StartScreen';

export default function MindReaderStartPage() {
  return (
    <ClientOnly>
      <MindReaderStartScreen />
    </ClientOnly>
  );
}
