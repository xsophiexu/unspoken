import { ClientOnly } from '@/lib/ClientOnly';
import { ModesScreen } from '@/screens/ModesScreen';

export default function ModesPage() {
  return (
    <ClientOnly>
      <ModesScreen />
    </ClientOnly>
  );
}
