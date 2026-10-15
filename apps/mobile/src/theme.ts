import type { TextStyle } from 'react-native';

export type Theme = {
  name: string;
  bg: string;
  tile: string;
  accent: string;
  ink: string;
  muted: string;
  track: string;
  barIdle: string;
  barSkip: string;
  correctText: string;
  outline: string;
  onAccent: string;
  onAccentMuted: string;
};

// Palettes from the "Change theme" list in the design canvas. Teal is the default.
export const THEMES: Theme[] = [
  {
    name: 'Teal',
    bg: '#E2E8E7',
    tile: '#CCDCDA',
    accent: '#3F7470',
    ink: '#24393A',
    muted: '#5C6E6E',
    track: '#C3D3D1',
    barIdle: '#D3DEDC',
    barSkip: '#8A9E9C',
    correctText: '#2C5E5A',
    outline: '#8FA5A3',
    onAccent: '#FFFFFF',
    onAccentMuted: '#D3DEDC',
  },
  {
    name: 'Heather',
    bg: '#ECE6EE',
    tile: '#DCCFE0',
    accent: '#806887',
    ink: '#3A2E40',
    muted: '#6E6273',
    track: '#D3C6D8',
    barIdle: '#DDD3E1',
    barSkip: '#9C8EA2',
    correctText: '#664F6D',
    outline: '#A597AA',
    onAccent: '#FFFFFF',
    onAccentMuted: '#E6DCE9',
  },
  {
    name: 'Sage',
    bg: '#E4E9E2',
    tile: '#D2DCCD',
    accent: '#5C7558',
    ink: '#2C3A2A',
    muted: '#5F6B5C',
    track: '#C8D3C3',
    barIdle: '#D6DED2',
    barSkip: '#8D9C89',
    correctText: '#475E44',
    outline: '#97A693',
    onAccent: '#FFFFFF',
    onAccentMuted: '#DCE4D8',
  },
  {
    name: 'Rose',
    bg: '#F1E6EA',
    tile: '#E5D0D8',
    accent: '#A8667E',
    ink: '#4A2C37',
    muted: '#7A6068',
    track: '#E0C9D1',
    barIdle: '#E8D8DE',
    barSkip: '#B0939D',
    correctText: '#8A4F64',
    outline: '#BC9DA8',
    onAccent: '#FFFFFF',
    onAccentMuted: '#F2E1E7',
  },
];

const FAMILY = {
  400: 'Manrope_400Regular',
  500: 'Manrope_500Medium',
  600: 'Manrope_600SemiBold',
  700: 'Manrope_700Bold',
  800: 'Manrope_800ExtraBold',
} as const;

export function font(weight: keyof typeof FAMILY): TextStyle {
  return { fontFamily: FAMILY[weight] };
}
