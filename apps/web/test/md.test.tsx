import { en, mdEn } from '@unspoken/content';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SPECIALTY_IDS } from '@unspoken/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { catalogs } from '@/lib/catalog';
import { EDITION_STORAGE_KEY } from '@/lib/edition';
import { MD_SETTINGS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { HomeScreen } from '@/screens/HomeScreen';
import { ModesScreen } from '@/screens/ModesScreen';
import { PlayScreen, TOUR_STORAGE_KEY } from '@/screens/PlayScreen';
import { SetupScreen } from '@/screens/SetupScreen';
import { THEME_STORAGE_KEY } from '@/theme/boot';

import { renderApp, saved } from './app';

const rules = mdEn.zenRules;
const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? 'null') as Record<string, unknown> | null;
const zen = { mode: 'zen', difficulties: ['Tricky'], categories: [], specialties: [], skips: 3, noTimeLimit: true, noSkipLimit: true, scoreTarget: 10, noScoreTarget: true };

// A returning UnspokenMD player on the Card layout who has seen How to play.
function inMd(settings: Record<string, unknown> = zen) {
  saved({
    [EDITION_STORAGE_KEY]: { edition: 'md', look: 'light', character: 'heart' },
    [MD_SETTINGS_STORAGE_KEY]: settings,
    [TOUR_STORAGE_KEY]: en.howToPlay.version,
    [THEME_STORAGE_KEY]: { style: 'card', color: 'teal', mode: 'light' },
  });
}

function renderPlay(extra?: React.ReactNode) {
  const result = renderApp(
    <>
      {extra}
      <section aria-label="game">
        <PlayScreen />
      </section>
    </>,
  );
  return { ...result, game: within(screen.getByRole('region', { name: 'game' })) };
}

const word = () => screen.getByRole('heading', { level: 1 });

// Find a card: search for a term and play it next.
async function playFromSearch(user: ReturnType<typeof userEvent.setup>, term: string) {
  await user.click(screen.getByRole('button', { name: mdEn.play.search }));
  await user.type(screen.getByRole('searchbox', { name: mdEn.search.label }), term);
  await user.click(screen.getByRole('button', { name: new RegExp(`^${term},`) }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UnspokenMD modes', () => {
  it('lists Zen, Versus and Ladder with their two lines, each opening its setup', () => {
    inMd();
    renderApp(<ModesScreen />);
    const zenTile = screen.getByRole('link', { name: /^Zen/ });
    expect(zenTile).toHaveTextContent(mdEn.modes.zen.sub);
    expect(zenTile).toHaveAttribute('href', '/setup/?mode=zen');
    expect(screen.getByRole('link', { name: /^Versus/ })).toHaveTextContent(mdEn.modes.versus.sub);
    expect(screen.getByRole('link', { name: /^Versus/ })).toHaveAttribute('href', '/versus/');
    expect(screen.getByRole('link', { name: /^Ladder/ })).toHaveAttribute('href', '/setup/?mode=ladder');
    expect(screen.queryByRole('link', { name: /^Classic/ })).not.toBeInTheDocument();
  });

  it('goes back to Home, where Modes always opens from', () => {
    inMd();
    renderApp(<ModesScreen />);
    expect(screen.getByRole('link', { name: en.modesScreen.back })).toHaveAttribute('href', '/');
  });
});

describe('UnspokenMD’s own link', () => {
  afterEach(() => window.history.pushState({}, '', '/'));

  it('opens Home in UnspokenMD at /md/ and saves the switch, keeping the other choices', () => {
    saved({ [EDITION_STORAGE_KEY]: { edition: 'unspoken', look: 'dark', character: 'heart' } });
    window.history.pushState({}, '', '/md/');
    renderApp(<HomeScreen />);
    expect(screen.getByRole('radio', { name: /Medical jargon/ })).toBeChecked();
    expect(screen.getByRole('link', { name: /Quick Play/ })).toHaveTextContent('Zen · One phone · Tricky');
    expect(stored(EDITION_STORAGE_KEY)).toMatchObject({ edition: 'md', look: 'dark' });
  });

  it('keeps the saved edition at /', () => {
    saved({ [EDITION_STORAGE_KEY]: { edition: 'unspoken' } });
    renderApp(<HomeScreen />);
    expect(screen.getByRole('radio', { name: /Everyday words/ })).toBeChecked();
    expect(stored(EDITION_STORAGE_KEY)).toMatchObject({ edition: 'unspoken' });
  });

  it('still lets the player switch editions from /md/', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/md');
    renderApp(<HomeScreen />);
    await user.click(screen.getByRole('radio', { name: /Everyday words/ }));
    expect(screen.getByRole('radio', { name: /Everyday words/ })).toBeChecked();
    expect(stored(EDITION_STORAGE_KEY)).toMatchObject({ edition: 'unspoken' });
  });
});

describe('Zen setup', () => {
  it('starts with every optional rule off, and switching one on opens its control', async () => {
    const user = userEvent.setup();
    inMd();
    renderApp(<SetupScreen mode="zen" />);
    expect(screen.getByRole('button', { name: /^Specialties: All specialties/ })).toHaveTextContent('All specialties · 1,021 cards');
    expect(screen.getByRole('checkbox', { name: /Tricky/ })).toBeChecked();
    expect(screen.getByText('76 cards')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Easy/ })).not.toBeInTheDocument();
    for (const rule of [rules.timer, rules.skipLimit, rules.scoreTarget]) expect(screen.getByText(rule.off)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Time limit/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: rules.timer.title }));
    expect(screen.getByText(rules.timer.on)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Time limit 1:30/ })).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: rules.skipLimit.title }));
    await user.click(screen.getByRole('button', { name: `More ${rules.skipLimit.stepper}` }));
    await user.click(screen.getByRole('switch', { name: rules.scoreTarget.title }));
    await user.click(screen.getByRole('button', { name: `Fewer ${rules.scoreTarget.stepper}` }));
    expect(screen.getByText(rules.scoreTarget.on)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: en.setup.start }));
    expect(stored(MD_SETTINGS_STORAGE_KEY)).toMatchObject({ mode: 'zen', noTimeLimit: false, roundSeconds: 90, noSkipLimit: false, skips: 4, noScoreTarget: false, scoreTarget: 9 });
    expect(stored(SETTINGS_STORAGE_KEY)).toMatchObject({ mode: 'endless' });
  });

  it('picks specialties on the Choose specialties sheet, with every card’s count', async () => {
    const user = userEvent.setup();
    inMd();
    renderApp(<SetupScreen mode="zen" />);
    await user.click(screen.getByRole('button', { name: /^Specialties:/ }));
    const sheet = within(screen.getByRole('dialog', { name: mdEn.specialtiesSheet.title }));
    const all = sheet.getByRole('checkbox', { name: /^All specialties/ });
    expect(all).toBeChecked();

    await user.click(sheet.getByRole('checkbox', { name: /^Cardiovascular/ }));
    await user.click(sheet.getByRole('checkbox', { name: /^Respiratory/ }));
    expect(all).not.toBeChecked();
    expect(sheet.getByRole('status')).toHaveTextContent('166 cards');

    await user.click(sheet.getByRole('button', { name: mdEn.specialtiesSheet.done }));
    expect(screen.getByRole('button', { name: /^Specialties:/ })).toHaveTextContent('Cardiovascular, Respiratory · 166 cards');
  });
});

describe('UnspokenMD Quick Play', () => {
  it('keeps each edition’s settings apart and shows the MD ones on Home', async () => {
    const user = userEvent.setup();
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulties: ['Hard'], categories: [], skips: 3 }, [MD_SETTINGS_STORAGE_KEY]: { ...zen, difficulties: ['Expert'] } });
    renderApp(<HomeScreen />);
    const quickPlay = () => screen.getByRole('link', { name: /Quick Play/ });
    expect(quickPlay()).toHaveTextContent('Classic · One phone · Hard');
    await user.click(screen.getByRole('radio', { name: /Medical jargon/ }));
    expect(quickPlay()).toHaveTextContent('Zen · One phone · Expert');
    await user.click(screen.getByRole('radio', { name: /Everyday words/ }));
    expect(quickPlay()).toHaveTextContent('Classic · One phone · Hard');
  });

  it('starts Zen with the last settings, even after a Ladder game, and counts only the score', async () => {
    const user = userEvent.setup();
    inMd({ ...zen, mode: 'ladder', difficulties: ['Hard'] });
    const { game } = renderPlay(<HomeScreen />);
    expect(game.getByText('Ladder')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Quick Play/ }));
    expect(game.getByText(mdEn.play.title)).toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Difficulty Hard, All specialties. Tap to change.' })).toHaveTextContent('HARD · ALL');
    expect(game.getByText('0 correct · 0 skipped')).toBeInTheDocument();
    expect(game.getByText(mdEn.play.bannedLabel)).toBeInTheDocument();
    expect(game.getAllByRole('listitem')).toHaveLength(6);

    // Each answer lands once the card has flown off.
    await user.click(game.getByRole('button', { name: en.play.correct }));
    expect(await game.findByText('1 correct · 0 skipped')).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: en.play.skip }));
    expect(await game.findByText('1 correct · 1 skipped')).toBeInTheDocument();

    await user.click(game.getByRole('button', { name: en.a11y.menu }));
    const menu = within(screen.getByRole('dialog', { name: en.menu.title }));
    expect(menu.getByText('1 correct · 1 skipped · All specialties')).toBeInTheDocument();
    expect(menu.getByText(mdEn.menu.changeSettings)).toBeInTheDocument();
  });

  it('plays a card found in search next, labeled From search, then carries on', async () => {
    const user = userEvent.setup();
    inMd();
    renderPlay();
    await playFromSearch(user, 'Pneumothorax');
    expect(word()).toHaveTextContent('Pneumothorax');
    expect(screen.getByText('From search · Tough · Respiratory')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: en.play.correct }));
    expect(await screen.findByText('1 correct · 0 skipped')).toBeInTheDocument();
    expect(word()).not.toHaveTextContent('Pneumothorax');
    expect(screen.getByText(en.play.yourWord)).toBeInTheDocument();
  });

  it('finds terms at any difficulty, with each one’s difficulty and specialty', async () => {
    const user = userEvent.setup();
    inMd();
    renderPlay();
    await user.click(screen.getByRole('button', { name: mdEn.play.search }));
    await user.type(screen.getByRole('searchbox', { name: mdEn.search.label }), 'pneu');
    const sheet = within(screen.getByRole('dialog', { name: mdEn.search.title }));
    expect(sheet.getByRole('status')).toHaveTextContent('7 cards');
    expect(sheet.getByRole('button', { name: /^Pneumonia,/ })).toHaveTextContent('Tricky · Respiratory');
    expect(sheet.getByRole('button', { name: /^Pneumocystis pneumonia,/ })).toHaveTextContent('Legend · Infectious disease');
  });

  it('changes the word bank from the chip: a specialty on its tab, applied as a new game', async () => {
    const user = userEvent.setup();
    inMd();
    renderPlay();
    await user.click(screen.getByRole('button', { name: /^Difficulty Tricky, All specialties/ }));
    const sheet = within(screen.getByRole('dialog', { name: mdEn.picksSheet.tabs }));
    expect(sheet.getByRole('checkbox', { name: /Tricky/ })).toBeChecked();
    expect(sheet.getByRole('link', { name: mdEn.picksSheet.custom })).toHaveAttribute('href', '/setup/?mode=zen');

    await user.click(sheet.getByRole('radio', { name: mdEn.picksSheet.specialties }));
    await user.click(sheet.getByRole('checkbox', { name: /^Respiratory/ }));
    await user.click(sheet.getByRole('button', { name: mdEn.picksSheet.apply }));

    expect(screen.getByRole('button', { name: /^Difficulty Tricky, Respiratory/ })).toHaveTextContent('TRICKY · RESP');
    expect(stored(MD_SETTINGS_STORAGE_KEY)).toMatchObject({ specialties: ['respiratory'], difficulties: ['Tricky'] });
  });
});

describe('UnspokenMD game header', () => {
  const chip = () => screen.getByRole('button', { name: /^Difficulty Tricky/ });

  it('names the word bank on the chip: ALL, one specialty’s short name, or how many of 13', () => {
    inMd({ ...zen, specialties: ['gastrointestinal'] });
    const one = renderPlay();
    expect(chip()).toHaveTextContent('TRICKY · GI');
    one.unmount();

    inMd({ ...zen, specialties: ['cardiovascular', 'renal', 'neurology'] });
    const several = renderPlay();
    expect(chip()).toHaveTextContent('TRICKY · 3 OF 13');
    several.unmount();

    // Every specialty picked one by one is the same as All.
    inMd({ ...zen, specialties: [...SPECIALTY_IDS] });
    renderPlay();
    expect(chip()).toHaveTextContent('TRICKY · ALL');
  });

  it('says Zen for a game started on New game, and keeps saying it after a reload', async () => {
    const user = userEvent.setup();
    inMd();
    const first = renderPlay(<SetupScreen mode="zen" />);
    await user.click(screen.getByRole('button', { name: en.setup.start }));
    expect(first.game.getByText(mdEn.modes.zen.name)).toBeInTheDocument();
    expect(first.game.queryByText(mdEn.play.title)).not.toBeInTheDocument();
    first.unmount();

    const { game } = renderPlay();
    expect(game.getByText(mdEn.modes.zen.name)).toBeInTheDocument();
  });

  it('says Quick Play once Home’s Quick Play starts the next game', async () => {
    const user = userEvent.setup();
    inMd({ ...zen, mode: 'ladder' });
    saved({ [catalogs.md.startKey]: 'setup' });
    const { game } = renderPlay(<HomeScreen />);
    await user.click(screen.getByRole('link', { name: /Quick Play/ }));
    expect(game.getByText(mdEn.play.title)).toBeInTheDocument();
  });

  it('asks for ideas for modes or terms on Game paused, and keeps the Home row', async () => {
    const user = userEvent.setup();
    inMd();
    renderPlay();
    await user.click(screen.getByRole('button', { name: en.a11y.menu }));
    const menu = within(screen.getByRole('dialog', { name: en.menu.title }));
    expect(menu.getByRole('link', { name: new RegExp(en.menu.feedback.title) })).toHaveTextContent(mdEn.menu.feedback);
    expect(menu.getByRole('link', { name: new RegExp(en.menu.home.title) })).toHaveAttribute('href', '/');
  });
});

describe('Banned chips', () => {
  // Layout is the browser's; jsdom has none. Chips measure 10px a letter plus 30px of padding, and
  // the list is 280px wide.
  function measureChips() {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const width = this.tagName === 'LI' ? (this.textContent?.length ?? 0) * 10 + 30 : this.tagName === 'UL' ? 280 : 0;
      return { width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0, toJSON: () => ({}) } as DOMRect;
    });
  }

  it('packs onto the fewest lines, moving Psoas sign up beside Fecalith', async () => {
    const user = userEvent.setup();
    measureChips();
    inMd();
    renderPlay();
    await playFromSearch(user, 'Appendicitis');
    const chips = within(screen.getByRole('region', { name: en.play.dontSay })).getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent)).toEqual(["McBurney's point", 'RLQ pain', 'Periumbilical', 'Fecalith', 'Psoas sign', 'Rebound tenderness']);
  });
});
