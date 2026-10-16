// One file per weight, so only the weights the text styles use are bundled.
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { fonts } from '@unspoken/design-tokens';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import { PrefsProvider, usePrefs } from '../state/prefs';
import { useAnalytics, useWebScrollbars } from '../web';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.native[400]]: Manrope_400Regular,
    [fonts.native[500]]: Manrope_500Medium,
    [fonts.native[600]]: Manrope_600SemiBold,
    [fonts.native[700]]: Manrope_700Bold,
    [fonts.native[800]]: Manrope_800ExtraBold,
  });
  useAnalytics();
  // If the font fails to load, carry on with the system font rather than a blank screen.
  if (!loaded && !error) return null;
  return (
    <PrefsProvider>
      <Screens />
    </PrefsProvider>
  );
}

function Screens() {
  const { theme } = usePrefs();
  useWebScrollbars(theme.colors.outline, theme.colors.muted);
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }} />;
}
