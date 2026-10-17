import { describe, expect, it } from 'vitest';

import { AA_NON_TEXT, AA_TEXT, COLOR_IDS, COLOR_MODES, contrastRatio, palettes, popoverColors, teamColor, teamColorOrder, teamColors } from '../src';

describe('Mind Reader team colors', () => {
  it('every team dot stands out on the page and on raised cards in every color and mode', () => {
    const misses: string[] = [];
    for (const id of COLOR_IDS)
      for (const mode of COLOR_MODES)
        for (const dot of teamColors[mode])
          for (const bg of [palettes[id][mode].bg, palettes[id][mode].surfaceRaised])
            if (contrastRatio(dot, bg) < AA_NON_TEXT) misses.push(`${id} ${mode} ${dot} on ${bg}`);
    expect(misses).toEqual([]);
  });

  it('gives the maximum teams different colors in order, wrapping past the end', () => {
    expect(new Set(teamColorOrder).size).toBe(teamColors.light.length);
    expect(teamColor(teamColors.light.length, 'light')).toBe(teamColor(0, 'light'));
  });

  it('keeps the player menu’s text readable', () => {
    for (const id of COLOR_IDS)
      for (const mode of COLOR_MODES) {
        const p = popoverColors(palettes[id][mode], mode);
        expect(contrastRatio(p.ink, p.bg)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(p.danger, p.bg)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(p.ink, p.sub)).toBeGreaterThanOrEqual(AA_TEXT);
      }
  });
});
