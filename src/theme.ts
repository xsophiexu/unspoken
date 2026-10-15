import { useColorScheme } from 'react-native';

const light = {
  bg: '#eceef4',
  card: '#ffffff',
  ink: '#161827',
  muted: '#5d6178',
  line: '#dde0ea',
  accent: '#3a3fd8',
  ok: '#1d8a5a',
  ban: '#c8334a',
  banSoft: '#fbe9ec',
  onSolid: '#ffffff',
};

const dark: typeof light = {
  bg: '#0f1018',
  card: '#1b1d2b',
  ink: '#f1f2f8',
  muted: '#a2a6bf',
  line: '#2e3145',
  accent: '#8f93ff',
  ok: '#4fd39a',
  ban: '#ff7d8f',
  banSoft: '#3a1c25',
  onSolid: '#0f1018',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
