import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_SETTINGS } from './src/game';
import { ModesScreen } from './src/screens/ModesScreen';
import { PlayScreen } from './src/screens/PlayScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { THEMES } from './src/theme';
import type { GameSettings } from './src/types';

type Screen = 'play' | 'setup' | 'modes';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // The app opens straight into a Classic game, the Current Version screen.
  const [screen, setScreen] = useState<Screen>('play');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [themeIndex, setThemeIndex] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const theme = THEMES[themeIndex];

  const startGame = (next: GameSettings) => {
    setSettings(next);
    setGameKey((k) => k + 1);
    setScreen('play');
  };

  // If the font fails to load, carry on with the system font rather than a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        {screen === 'play' && (
          <PlayScreen
            key={gameKey}
            settings={settings}
            theme={theme}
            onRestart={() => startGame(settings)}
            onChangeSettings={() => setScreen('modes')}
            onChangeTheme={setThemeIndex}
          />
        )}
        {screen === 'setup' && (
          <SetupScreen settings={settings} theme={theme} onStart={startGame} onModes={() => setScreen('modes')} />
        )}
        {screen === 'modes' && (
          <ModesScreen
            current={settings.mode}
            theme={theme}
            onNext={(mode) => {
              setSettings({ ...settings, mode });
              setScreen('setup');
            }}
          />
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
