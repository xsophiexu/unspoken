import { DEFAULT_THEME, palettes, radius } from '@unspoken/design-tokens';

import { iconPaths } from '@/components/ui/Icon';

// The browser tab icon: the speech bubble on the default color's accent, written to /icon.svg at
// build time.
export const dynamic = 'force-static';

const GRID = 24;

export function GET() {
  const { accent, onAccent } = palettes[DEFAULT_THEME.color].light;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}"><rect width="${GRID}" height="${GRID}" rx="${radius.xs}" fill="${accent}"/><path d="${iconPaths.bubble}" fill="none" stroke="${onAccent}" stroke-width="2" stroke-linejoin="round" transform="translate(${GRID / 2} ${GRID / 2}) scale(0.75) translate(${-GRID / 2} ${-GRID / 2})"/></svg>`;
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } });
}
