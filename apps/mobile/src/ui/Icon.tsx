import Svg, { Circle, Path, Rect } from 'react-native-svg';

// The line icons from the boards, drawn on a 20-unit grid and scaled to the requested size.
export type IconName =
  | 'pause'
  | 'dots'
  | 'sliders'
  | 'chevronDown'
  | 'chevronRight'
  | 'check'
  | 'cross'
  | 'arrowRight'
  | 'arrowLeft'
  | 'send'
  | 'bubble'
  | 'restart'
  | 'newGame'
  | 'mic'
  | 'eye'
  | 'eyeOff'
  | 'play'
  | 'sun'
  | 'moon';

type Props = { name: IconName; size: number; color: string; background?: string };

const line = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 } as const;

export function Icon({ name, size, color, background = 'transparent' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {glyph(name, color, background)}
    </Svg>
  );
}

function glyph(name: IconName, color: string, background: string) {
  const stroke = { ...line, stroke: color };
  switch (name) {
    case 'pause':
      return <Path d="M6.5 3.5 V16.5 M13.5 3.5 V16.5" {...stroke} strokeWidth={3} />;
    case 'dots':
      return [4, 10, 16].map((x) => <Circle key={x} cx={x} cy={10} r={2} fill={color} />);
    case 'sliders':
      return (
        <>
          <Path d="M2.5 5h15M2.5 10h15M2.5 15h15" {...stroke} strokeWidth={1.7} />
          {[
            [6.5, 5],
            [13.5, 10],
            [8.5, 15],
          ].map(([cx, cy]) => (
            <Circle key={cy} cx={cx} cy={cy} r={2} fill={background} stroke={color} strokeWidth={1.7} />
          ))}
        </>
      );
    case 'chevronDown':
      return <Path d="M4 7.5l6 6 6-6" {...stroke} strokeWidth={3} />;
    case 'chevronRight':
      return <Path d="M7.5 4l6 6-6 6" {...stroke} strokeWidth={2.6} />;
    case 'check':
      return <Path d="M4 10.5l4 4 8-9" {...stroke} strokeWidth={2.6} />;
    case 'cross':
      return <Path d="M5 5l10 10M15 5L5 15" {...stroke} />;
    case 'arrowRight':
      return <Path d="M3.5 10h12M11 4.5l5.5 5.5-5.5 5.5" {...stroke} />;
    case 'arrowLeft':
      return <Path d="M16.5 10h-12M9 4.5L3.5 10 9 15.5" {...stroke} />;
    case 'send':
      return <Path d="M3 10l14-7-5 14-2.5-5.5z" {...stroke} />;
    case 'bubble':
      return <Path d="M4 4h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 14H9l-4 3v-3H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 4z" {...stroke} strokeWidth={1.8} />;
    case 'restart':
      return <Path d="M4 10a6 6 0 1 0 2-4.5M4 3v4h4" {...stroke} />;
    case 'newGame':
      return (
        <>
          <Rect x={3} y={3} width={6} height={6} rx={1.5} {...stroke} />
          <Rect x={11} y={3} width={6} height={6} rx={1.5} {...stroke} />
          <Rect x={3} y={11} width={6} height={6} rx={1.5} {...stroke} />
          <Path d="M14 11v6M11 14h6" {...stroke} />
        </>
      );
    case 'mic':
      return <Path d="M4 9a6 6 0 0 0 12 0M10 15v3M7.5 2.5h5v8a2.5 2.5 0 0 1-5 0z" {...stroke} strokeWidth={1.7} />;
    case 'eye':
    case 'eyeOff':
      return (
        <>
          <Path d="M1.5 10C3.6 5.8 6.6 3.8 10 3.8s6.4 2 8.5 6.2c-2.1 4.2-5.1 6.2-8.5 6.2S3.6 14.2 1.5 10z" {...stroke} strokeWidth={1.7} />
          <Circle cx={10} cy={10} r={2.7} {...stroke} strokeWidth={1.7} />
          {name === 'eyeOff' ? <Path d="M3.5 16.5l13-13" {...stroke} /> : null}
        </>
      );
    case 'play':
      return <Path d="M5 3l11 7-11 7z" fill={color} />;
    case 'sun':
      return (
        <>
          <Circle cx={10} cy={10} r={3.5} {...stroke} strokeWidth={1.8} />
          <Path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6L16 16M4 16l1.4-1.4M14.6 5.4L16 4" {...stroke} strokeWidth={1.8} />
        </>
      );
    case 'moon':
      return <Path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9z" {...stroke} strokeWidth={1.8} />;
  }
}
