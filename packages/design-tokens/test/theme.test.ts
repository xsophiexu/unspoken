import { describe, expect, it } from 'vitest';
import { COLOR_IDS, DEFAULT_THEME, cssText, cssVariables, nativeTextStyle, palettes, parseThemeSelection, resolveTheme } from '../src';

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
