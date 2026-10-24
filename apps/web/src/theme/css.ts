import {
  COLOR_IDS,
  COLOR_MODES,
  REGION_TONES,
  STYLE_IDS,
  scene,
  scenePalettes,
  sceneRegionColors,
  buttonPair,
  cssVariables,
  layout,
  layoutStyles,
  maxWidth,
  motion,
  opacity,
  palettes,
  popoverColors,
  resolveTheme,
  spotlight,
  teamColors,
  textStyles,
  type ColorId,
  type ColorMode,
  type RegionSlot,
  type SceneGradient,
  type SceneLook,
  type TextStyleToken,
} from '@unspoken/design-tokens';

// Builds the site's design-token stylesheet (served as /theme.css) from @unspoken/design-tokens.
// Nothing here is a design value: every number and color comes from the tokens.
//
//  :root                                   values every palette shares (space, radius, type, sizes)
//  [data-color=…][data-mode=…]             one block per palette and mode; set on <html> for the
//                                          player's theme and on Customize thumbnails for previews
//  [data-region=…]                         region tones, mapped onto --region-* for slot components
//  [data-scene=…]                          a Halloween look's night page: its region colors and
//                                          background (after the region rules, so it wins)
//  .un-text-…                              text styles

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace('.', '-');
const px = (n: number) => `${n}px`;
const ms = (n: number) => `${n}ms`;

type Vars = Record<string, string>;

const rule = (selector: string, vars: Vars, extra = '') =>
  `${selector}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}${extra}}`;

// Nested token groups as --un-<group>-<path> custom properties.
function flatten(prefix: string, value: unknown, unit: (path: string, n: number) => string, out: Vars = {}): Vars {
  if (typeof value === 'number') out[`--un-${prefix}`] = unit(prefix, value);
  else if (typeof value === 'string') out[`--un-${prefix}`] = value;
  else if (Array.isArray(value)) out[`--un-${prefix}`] = `cubic-bezier(${value.join(',')})`;
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) flatten(`${prefix}-${kebab(key)}`, child, unit, out);
  }
  return out;
}

// Grid column counts and scale factors are plain numbers; everything else in layout is px.
const layoutUnit = (path: string, n: number) => (path.startsWith('layout-grid') || path.endsWith('scale') ? String(n) : px(n));
// Motion keys say their unit: …Ms, …Px, …Deg; the rest (scales, opacities, spring settings) are plain.
const motionUnit = (path: string, n: number) =>
  path.startsWith('motion-duration') || path.endsWith('-ms') ? ms(n) : path.endsWith('-px') || path.endsWith('from-y') ? px(n) : path.endsWith('-deg') ? `${n}deg` : String(n);

function sharedTokens(): Vars {
  return {
    ...flatten('layout', layout, layoutUnit),
    ...flatten('max-width', maxWidth, (_, n) => px(n)),
    ...flatten('motion', motion, motionUnit),
    ...flatten('spotlight', spotlight, (path, n) => (path.endsWith('share') ? String(n) : px(n))),
    ...flatten('opacity', opacity, (_, n) => String(n)),
    // Flex-grow shares, so plain numbers.
    ...flatten('button-pair', buttonPair, (_, n) => String(n)),
    ...flatten('scene', scene, (path, n) => (path.endsWith('share') ? String(n) : path.endsWith('tilt') ? `${n}deg` : px(n))),
  };
}

// A style that takes the player's color, so resolveTheme returns the palette asked for.
const followStyle = STYLE_IDS.find((id) => layoutStyles[id].color.kind === 'follow') ?? STYLE_IDS[0];

function paletteVars(color: ColorId, mode: ColorMode): Vars {
  const theme = resolveTheme({ style: followStyle, color, mode });
  return {
    ...cssVariables(theme),
    // Mind Reader: the team colors by index, and the menu that opens on a player.
    ...Object.fromEntries(teamColors[mode].map((c, i) => [`--un-team-${i}`, c])),
    ...Object.fromEntries(Object.entries(popoverColors(theme.colors, mode)).map(([k, v]) => [`--un-popover-${k}`, v])),
    // The How to play Play label: the color's light-mode accent text in both modes (see spotlight tokens).
    '--un-spotlight-play-ink': palettes[color].light.accentText,
  };
}

const REGION_SLOTS = Object.keys(resolveTheme({ style: followStyle, color: COLOR_IDS[0], mode: COLOR_MODES[0] }).regions.base) as RegionSlot[];

function regionRules(): string[] {
  return REGION_TONES.map((tone) =>
    rule(
      `[data-region="${tone}"]`,
      Object.fromEntries(REGION_SLOTS.map((slot) => [`--region-${kebab(slot)}`, `var(--un-${tone}-${kebab(slot)})`])),
      ';background-color:var(--region-bg);color:var(--region-ink)',
    ),
  );
}

function gradientCss(g: SceneGradient): string {
  const stops = g.stops.map(([color, at]) => `${color} ${at * 100}%`).join(',');
  return g.kind === 'radial' ? `radial-gradient(ellipse at ${g.at[0]}% ${g.at[1]}%,${stops})` : `linear-gradient(${stops})`;
}

// A Halloween look's page: its own region colors (the slot components read --region-*) over its
// gradient, and the star color for the art.
function sceneRules(): string[] {
  return STYLE_IDS.flatMap((id) => {
    const look: SceneLook | undefined = layoutStyles[id].scene?.look;
    if (!look) return [];
    const colors = sceneRegionColors(look);
    return [
      rule(
        `[data-region][data-scene="${look}"]`,
        {
          ...Object.fromEntries(REGION_SLOTS.map((slot) => [`--region-${kebab(slot)}`, colors[slot]])),
          '--scene-star': scenePalettes[look].star,
        },
        `;background-color:var(--region-bg);background-image:${gradientCss(scenePalettes[look].background)};color:var(--region-ink)`,
      ),
    ];
  });
}

function textRules(): string[] {
  return (Object.entries(textStyles) as [string, TextStyleToken][]).map(([name, t]) => {
    const v = (part: string) => `var(--un-text-${kebab(name)}-${part})`;
    const decls = [
      `font-size:${v('size')}`,
      `font-weight:${v('weight')}`,
      t.lineHeight !== undefined && `line-height:${v('line-height')}`,
      t.letterSpacing !== undefined && `letter-spacing:${v('letter-spacing')}`,
      t.uppercase && 'text-transform:uppercase',
      t.tabular && 'font-variant-numeric:tabular-nums',
    ].filter(Boolean);
    return `.un-text-${kebab(name)}{${decls.join(';')}}`;
  });
}

export function themeCss(): string {
  const combos = COLOR_IDS.flatMap((color) => COLOR_MODES.map((mode) => ({ color, mode, vars: paletteVars(color, mode) })));
  // Values every palette and mode agree on go to :root once; the rest go to each palette's block.
  const first = combos[0]?.vars ?? {};
  const shared = Object.fromEntries(Object.entries(first).filter(([k, v]) => combos.every((c) => c.vars[k] === v)));
  const perCombo = combos.map(({ color, mode, vars }) =>
    rule(
      `[data-color="${color}"][data-mode="${mode}"]`,
      Object.fromEntries(Object.entries(vars).filter(([k]) => !(k in shared))),
    ),
  );
  const modes = COLOR_MODES.map((mode) => `[data-mode="${mode}"]{color-scheme:${mode}}`);
  return [rule(':root', { ...shared, ...sharedTokens() }), ...perCombo, ...modes, ...regionRules(), ...sceneRules(), ...textRules()].join('\n');
}
