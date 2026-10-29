import { ClientOnly } from '@/lib/ClientOnly';
import { HomeScreen } from '@/screens/HomeScreen';

// UnspokenMD's link to share: Home, opened in UnspokenMD (the edition provider and the boot script
// read the path; see editionForPath).
export default function MdHomePage() {
  return (
    <ClientOnly>
      <HomeScreen />
    </ClientOnly>
  );
}
