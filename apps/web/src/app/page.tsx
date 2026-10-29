import { ClientOnly } from '@/lib/ClientOnly';
import { HomeScreen } from '@/screens/HomeScreen';

export default function HomePage() {
  return (
    <ClientOnly>
      <HomeScreen />
    </ClientOnly>
  );
}
