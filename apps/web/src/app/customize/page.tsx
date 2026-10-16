import { ClientOnly } from '@/lib/ClientOnly';
import { CustomizeScreen } from '@/screens/CustomizeScreen';

export default function CustomizePage() {
  return (
    <ClientOnly>
      <CustomizeScreen />
    </ClientOnly>
  );
}
