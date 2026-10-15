import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { PlayScreen } from './src/screens/PlayScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { useTheme } from './src/theme';
import type { RoundResult, RoundSettings } from './src/types';

type Screen =
  | { name: 'home' }
  | { name: 'play'; settings: RoundSettings; round: number }
  | { name: 'results'; settings: RoundSettings; result: RoundResult };

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const t = useTheme();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const start = useCallback(
    (settings: RoundSettings) => setScreen({ name: 'play', settings, round: Date.now() }),
    [],
  );

  const finish = useCallback((result: RoundResult) => {
    setScreen((s) => (s.name === 'play' ? { name: 'results', settings: s.settings, result } : s));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {screen.name === 'home' && <HomeScreen onStart={start} />}
      {screen.name === 'play' && (
        <PlayScreen
          key={screen.round}
          settings={screen.settings}
          onFinish={finish}
          onQuit={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'results' && (
        <ResultsScreen
          result={screen.result}
          onPlayAgain={() => start(screen.settings)}
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
