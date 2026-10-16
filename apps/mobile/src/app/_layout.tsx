import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';

import { PrefsProvider, usePrefs } from '../state/prefs';
import { useAnalytics, useWebScrollbars } from '../web';

export default function RootLayout() {
  const [loaded, error] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
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
