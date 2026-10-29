import { describe, expect, it } from 'vitest';

import { HALLOWEEN_STYLE_IDS, editionStyles, palettes, resolveEditionTheme, type ThemeSelection } from '../src';

const light = { look: 'light', systemMode: 'light' } as const;

describe('UnspokenMD’s theme', () => {
  it('draws every style in its blue, even a style with its own pinned color', () => {
    for (const style of editionStyles('md')) {
      const theme = resolveEditionTheme({ style, color: 'rose', mode: 'light' }, 'md', light);
      expect(theme.color).toBe('md');
      expect(theme.colors).toBe(palettes.md.light);
    }
  });

  it('offers no holiday looks, and plays a saved one as the default layout', () => {
    for (const id of HALLOWEEN_STYLE_IDS) expect(editionStyles('md')).not.toContain(id);
    const theme = resolveEditionTheme({ style: 'graveyard', color: 'teal', mode: 'light' }, 'md', light);
    expect(theme.selection.style).toBe('card');
    expect(theme.mode).toBe('light');
  });

  it('follows its own Look, with Phone setting taking the device’s mode', () => {
    const saved: ThemeSelection = { style: 'card', color: 'teal', mode: 'light' };
    expect(resolveEditionTheme(saved, 'md', { look: 'dark', systemMode: 'light' }).colors).toBe(palettes.md.dark);
    expect(resolveEditionTheme(saved, 'md', { look: 'system', systemMode: 'dark' }).mode).toBe('dark');
    expect(resolveEditionTheme(saved, 'md', { look: 'system', systemMode: 'light' }).mode).toBe('light');
  });
});

describe('Unspoken’s theme', () => {
  it('keeps the player’s style, color and mode, whatever UnspokenMD’s Look is', () => {
    const theme = resolveEditionTheme({ style: 'ledger', color: 'sage', mode: 'dark' }, 'unspoken', { look: 'light', systemMode: 'light' });
    expect(theme.selection.style).toBe('ledger');
    expect(theme.color).toBe('sage');
    expect(theme.mode).toBe('dark');
  });

  it('keeps the holiday looks and their own night mode', () => {
    expect(editionStyles('unspoken')).toEqual(expect.arrayContaining([...HALLOWEEN_STYLE_IDS]));
    const theme = resolveEditionTheme({ style: 'graveyard', color: 'teal', mode: 'light' }, 'unspoken', light);
    expect(theme.selection.style).toBe('graveyard');
    expect(theme.mode).toBe('dark');
  });
});
