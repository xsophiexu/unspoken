// Line icons drawn on a 24-unit grid in the current text color. Sizes come from the caller.

export const iconPaths = {
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  sliders: 'M3 6h18M3 12h18M3 18h18',
  pause: 'M9 5v14M15 5v14',
  caret: 'M7 10l5 5 5-5',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  arrowRight: 'M5 12h13M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  send: 'M3.5 12l17-8.5-6 17-3-6.5z',
  bubble: 'M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  restart: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  play: 'M7 4.5l12 7.5-12 7.5z',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 6v12M6 12h12',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.5h.01',
  pencil: 'M16.2 4.2l3.6 3.6L8.4 19.2H4.8v-3.6zM13.8 6.6l3.6 3.6',
  shuffle: 'M3 7.2h3.6c4.2 0 6.6 9.6 10.8 9.6h3.6M3 16.8h3.6c1.7 0 3-1.4 4.1-3.4M13.3 10.6c1.1-1.9 2.4-3.4 4.1-3.4h3.6M18.6 4.2l3 3-3 3M18.6 13.8l3 3-3 3',
  timer: 'M12 5.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 9v4l2.5 1.8M9.5 2.5h5',
  minus: 'M6 12h12',
} as const;

export type IconName = keyof typeof iconPaths;

// Filled shapes; the rest are strokes.
const filled: ReadonlySet<IconName> = new Set(['play']);

type IconProps = { name: IconName; size?: number | string; className?: string };

export function Icon({ name, size = '1em', className }: IconProps) {
  const fill = filled.has(name);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={name === 'dots' ? 4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
      {name === 'sliders' && (
        <g fill="var(--region-bg, var(--un-color-bg))">
          <circle cx="8" cy="6" r="2.4" />
          <circle cx="16" cy="12" r="2.4" />
          <circle cx="10" cy="18" r="2.4" />
        </g>
      )}
    </svg>
  );
}
