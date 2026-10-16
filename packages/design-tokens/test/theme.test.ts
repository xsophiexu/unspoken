import { describe, expect, it } from 'vitest';
import {
  COLOR_IDS,
  DEFAULT_THEME,
  STYLE_IDS,
  cssText,
  cssVariables,
  layout,
  layoutStyleFor,
  layoutStyles,
  nativeTextStyle,
  palettes,
  parseThemeSelection,
  playMargins,
  resolveTheme,
  ringCardSize,
} from '../src';

describe('resolveTheme', () => {
  it('starts on Card in teal, light', () => {
    const theme = resolveTheme(DEFAULT_THEME);
    expect(theme.style.id).toBe('card');
    expect(theme.colors.bg).toBe(palettes.teal.light.bg);
  });

  it('gives follow styles the player’s color and mode', () => {
    const theme = resolveTheme({ style: 'ledger', color: 'rose', mode: 'dark' });
    expect(theme.color).toBe('rose');
    expect(theme.colors.accent).toBe(palettes.rose.dark.accent);
  });

  it('keeps Split sage and Sheet clay whatever color is picked, in either mode', () => {
    for (const color of COLOR_IDS) {
      expect(resolveTheme({ style: 'split', color, mode: 'light' }).colors).toBe(palettes.sage.light);
      expect(resolveTheme({ style: 'sheet', color, mode: 'dark' }).colors).toBe(palettes.clay.dark);
    }
  });

  it('resolves region tones from the theme colors', () => {
    const theme = resolveTheme({ style: 'ink', color: 'lilac', mode: 'light' });
    expect(theme.regions.panel.bg).toBe(palettes.lilac.light.panel);
    expect(theme.regions.panel.ink).toBe(palettes.lilac.light.onPanel);
  });
});

describe('dark mode styles', () => {
  it('leaves every style as cataloged in light', () => {
    for (const id of STYLE_IDS) expect(resolveTheme({ style: id, color: 'teal', mode: 'light' }).style).toBe(layoutStyles[id]);
  });

  it('gives Chips an accent timer pill and Correct bar, a shaded Skip and tinted chips in dark', () => {
    const light = resolveTheme({ style: 'chips', color: 'slateBlue', mode: 'light' });
    const dark = resolveTheme({ style: 'chips', color: 'slateBlue', mode: 'dark' });
    expect(light.style.timer.fill).toBe('inverse');
    expect(dark.style.timer.fill).toBe('accent');
    expect(dark.regions[dark.style.regions.correct ?? 'base'].bg).toBe(palettes.slateBlue.dark.accent);
    expect(dark.regions[dark.style.regions.skip ?? 'base'].bg).not.toBe(light.regions[light.style.regions.skip ?? 'base'].bg);
    expect(dark.style.banned.chipFill).toBe('tint');
    expect(dark.regions.base.tint).toBe(palettes.slateBlue.dark.accentTint);
    // The rest of the slot is kept.
    expect(dark.style.timer.bar).toEqual(light.style.timer.bar);
    expect(dark.style.banned.variant).toBe('chips');
  });

  it('puts the Ombre footer on a deep accent tone in dark, not the grey panel', () => {
    const theme = resolveTheme({ style: 'ombre', color: 'slateBlue', mode: 'dark' });
    const footer = theme.regions[theme.style.regions.controls ?? 'base'];
    expect(footer.bg).not.toBe(palettes.slateBlue.dark.panel);
    expect(footer.accent).toBe(palettes.slateBlue.dark.deepAccent);
    expect(footer.onAccent).toBe(palettes.slateBlue.dark.onDeepAccent);
  });

  it('colors the Big timer clock with the vivid accent only in dark', () => {
    expect(resolveTheme({ style: 'bigTimer', color: 'mustard', mode: 'light' }).style.timer.vivid).toBeUndefined();
    const dark = resolveTheme({ style: 'bigTimer', color: 'mustard', mode: 'dark' });
    expect(dark.style.timer.vivid).toBe(true);
    expect(dark.regions.base.vivid).toBe(palettes.mustard.dark.accentVivid);
  });

  it('writes pure white headlines on the dark accent page (Sheet)', () => {
    expect(resolveTheme({ style: 'sheet', color: 'teal', mode: 'dark' }).regions.accent.ink).toBe('#FFFFFF');
  });

  it('mutes the Big timer word in dark', () => {
    expect(resolveTheme({ style: 'bigTimer', color: 'mustard', mode: 'light' }).style.word.color).toBe('accentText');
    expect(resolveTheme({ style: 'bigTimer', color: 'mustard', mode: 'dark' }).style.word.color).toBe('muted');
  });

  it('makes the Ink Correct a raised button with ink text in dark', () => {
    const theme = resolveTheme({ style: 'ink', color: 'lilac', mode: 'dark' });
    const lower = theme.regions[theme.style.regions.lower ?? 'panel'];
    expect(lower.bg).toBe(palettes.lilac.dark.panel);
    expect(lower.accent).toBe(palettes.lilac.dark.surfaceRaised);
    expect(lower.onAccent).toBe(palettes.lilac.dark.ink);
  });

  it('sinks the Split lower half and Skip to the track color in dark', () => {
    const theme = resolveTheme({ style: 'split', color: 'teal', mode: 'dark' });
    expect(theme.regions[theme.style.regions.lower ?? 'base'].bg).toBe(palettes.sage.dark.track);
    expect(theme.regions[theme.style.regions.skip ?? 'base'].bg).toBe(palettes.sage.dark.track);
  });

  it('tints the Sheet progress line and menu button with stone grey in dark', () => {
    const theme = resolveTheme({ style: 'sheet', color: 'teal', mode: 'dark' });
    const page = theme.regions[theme.style.regions.page];
    expect(page.bg).toBe(palettes.clay.dark.accent);
    expect(page.progress).toBe(palettes.clay.dark.surfaceRaised);
    expect(page.chip).not.toBe(palettes.clay.dark.surfaceRaised);
    expect(page.ink).toBe('#FFFFFF');
  });

  it('returns the same style object on every call', () => {
    expect(layoutStyleFor('chips', 'dark')).toBe(layoutStyleFor('chips', 'dark'));
  });
});

describe('both modes', () => {
  it('puts the Bottom list and controls on an accent-colored panel', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = resolveTheme({ style: 'bottom', color: 'slateBlue', mode });
      const lower = theme.regions[theme.style.regions.lower ?? 'panel'];
      expect(lower.bg).not.toBe(palettes.slateBlue[mode].panel);
      expect(lower.accent).toBe(palettes.slateBlue[mode].surfaceRaised);
      expect(lower.onAccent).toBe(palettes.slateBlue[mode].accentText);
    }
    expect(resolveTheme({ style: 'bottom', color: 'slateBlue', mode: 'dark' }).regions.accented.bg).toBe(palettes.slateBlue.dark.accent);
  });

  it('runs the Chips timer line over the page color, with no visible track', () => {
    for (const mode of ['light', 'dark'] as const) {
      const page = resolveTheme({ style: 'chips', color: 'slateBlue', mode }).regions[layoutStyles.chips.regions.page];
      expect(page.track).toBe(page.bg);
    }
  });
});

describe('play screen margins', () => {
  it('uses one side margin in every style', () => {
    const sides = new Set(STYLE_IDS.map((id) => playMargins(layoutStyles[id]).paddingX));
    expect(sides.size).toBe(1);
  });

  it('runs split bars to the bottom edge and starts Sheet lower than the rest', () => {
    for (const id of STYLE_IDS) {
      const m = playMargins(layoutStyles[id]);
      if (layoutStyles[id].controls.variant === 'splitBar') expect(m.paddingBottom).toBe(0);
      if (id !== 'sheet') expect(m.paddingTop).toBeLessThan(playMargins(layoutStyles.sheet).paddingTop);
    }
  });
});

describe('ringCardSize', () => {
  const { maxWidth, maxHeight } = layout.card;

  it('keeps the ring’s shape when the screen is narrower than the ring', () => {
    const width = layout.referenceScreen.width - 2 * layout.play.paddingX;
    const ring = ringCardSize(width, layout.referenceScreen.height);
    expect(ring.width).toBe(width);
    expect(ring.height / ring.width).toBeCloseTo(maxHeight / maxWidth);
  });

  it('stops growing at the largest ring and never overflows a short space', () => {
    expect(ringCardSize(1000, 1000)).toEqual({ width: maxWidth, height: maxHeight });
    expect(ringCardSize(300, 200)).toEqual({ width: 300, height: 200 });
  });
});

describe('parseThemeSelection', () => {
  it('keeps valid fields and defaults the rest', () => {
    expect(parseThemeSelection({ style: 'ombre', color: 'neon', mode: 'dark' })).toEqual({ style: 'ombre', color: 'teal', mode: 'dark' });
    expect(parseThemeSelection('{"style":"ombre"}')).toEqual(DEFAULT_THEME);
    expect(parseThemeSelection(null)).toEqual(DEFAULT_THEME);
  });
});

describe('cssVariables', () => {
  it('names colors, region slots and sizes as kebab-case custom properties', () => {
    const vars = cssVariables(resolveTheme({ style: 'card', color: 'clay', mode: 'light' }));
    expect(vars['--un-color-surface-raised']).toBe(palettes.clay.light.surfaceRaised);
    expect(vars['--un-ramp-1-bg']).toBe(palettes.clay.light.ramp[0]?.bg);
    expect(vars['--un-panel-ink']).toBe(palettes.clay.light.onPanel);
    expect(vars['--un-space-0-5']).toBe('2px');
    expect(vars['--un-text-big-clock-size']).toBe('92px');
    expect(vars['--un-text-word-letter-spacing']).toBe('-0.02em');
    expect(vars['--un-deep-accent']).toBe(palettes.clay.light.deepAccent);
    expect(vars['--un-base-tint']).toBe(palettes.clay.light.accentTint);
  });

  it('changes colors and shadows, not sizes, between light and dark', () => {
    const light = cssVariables(resolveTheme({ ...DEFAULT_THEME, mode: 'light' }));
    const dark = cssVariables(resolveTheme({ ...DEFAULT_THEME, mode: 'dark' }));
    expect(dark['--un-color-bg']).not.toBe(light['--un-color-bg']);
    expect(dark['--un-shadow-card']).not.toBe(light['--un-shadow-card']);
    expect(dark['--un-radius-card']).toBe(light['--un-radius-card']);
  });

  it('writes a CSS rule for a selector', () => {
    const css = cssText(resolveTheme(DEFAULT_THEME), '[data-theme="card"]');
    expect(css.startsWith('[data-theme="card"] {\n')).toBe(true);
    expect(css).toContain(`  --un-color-bg: ${palettes.teal.light.bg};`);
  });
});

describe('nativeTextStyle', () => {
  it('uses the per-weight family and resolves relative sizes to points', () => {
    expect(nativeTextStyle('word', 40)).toEqual({ fontFamily: 'Manrope_800ExtraBold', fontSize: 40, lineHeight: 42, letterSpacing: -0.8 });
    expect(nativeTextStyle('badge')).toMatchObject({ fontFamily: 'Manrope_800ExtraBold', textTransform: 'uppercase' });
    expect(nativeTextStyle('clock').fontVariant).toEqual(['tabular-nums']);
  });
});
