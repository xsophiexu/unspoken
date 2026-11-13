import { ClientOnly } from '@/lib/ClientOnly';
import { WordBankScreen } from '@/screens/WordBankScreen';

export default function WordBankPage() {
  return (
    <ClientOnly>
      <WordBankScreen />
    </ClientOnly>
  );
}
