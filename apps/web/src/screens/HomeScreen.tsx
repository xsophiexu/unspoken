'use client';

import { en } from '@unspoken/content';
import {
  difficultySpan,
  EDITION_IDS,
  format,
  homeQuickPlaySettings,
  isHomeQuickPlay,
  isSwipeOver,
  QUICK_PLAY_DIFFICULTIES,
  type Difficulty,
  type GameConfig,
  type GameSettings,
  type RoundState,
} from '@unspoken/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DeepDiveSheet } from '@/components/sheets/DeepDiveSheet';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { homeArt } from '@/lib/art';
import { catalogs } from '@/lib/catalog';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useEdition } from '@/state/edition';
import { useGame, type GameStart } from '@/state/game';

import styles from './HomeScreen.module.css';

const copy = en.home;
const difficultyNames = Object.fromEntries(Object.entries(en.difficulties).map(([id, d]) => [id, d.name])) as Record<Difficulty, string>;

// Quick Play's line: always all cards, Normal to Hard.
function quickPlayDetail(config: GameConfig): string {
  const difficulties = difficultySpan(QUICK_PLAY_DIFFICULTIES, { names: difficultyNames, span: en.difficultySpan.long, mixed: en.difficultyMix }, config);
  return format(copy.quickPlay.detail, { picks: en.themes.all, difficulties });
}

// Whether Quick Play can carry on with the game in progress: one Quick Play started, still playing
// what Quick Play plays, and not over yet.
function quickPlayInProgress(round: RoundState, start: GameStart, config: GameConfig): boolean {
  return start === 'quickPlay' && round.kind === 'swipe' && isHomeQuickPlay(round.settings, config) && !isSwipeOver(round);
}

const links: { href: string; icon: IconName; label: string }[] = [
  { href: routes.modes, icon: 'grid', label: copy.links.modes },
  { href: routes.customize, icon: 'brush', label: copy.links.customize },
  { href: routes.howToPlay, icon: 'help', label: copy.links.howToPlay },
];

// Home (home-build, screens 1 and 2): the edition switch, the fox holding the edition's card, Quick
// Play, the Deep dive and Custom game tiles, and links to Modes, Customize and How to play.
export function HomeScreen() {
  const { edition, setEdition } = useEdition();
  const { round, start, newGame } = useGame();
  const router = useRouter();
  const [diving, setDiving] = useState(false);
  const { config } = catalogs[edition];
  // Quick Play skips setup: the default mode with all cards at Normal, Tricky and Hard, whatever was
  // played last.
  const startQuickPlay = () => {
    if (!quickPlayInProgress(round, start, config)) newGame(homeQuickPlaySettings(config), undefined, 'quickPlay');
  };
  const startDeepDive = (settings: GameSettings) => {
    newGame(settings, undefined, 'deepDive');
    router.push(routes.play);
  };
  const art = homeArt[edition];

  return (
    <Screen tone="base" width="column">
      <div role="radiogroup" aria-label={copy.switchLabel} className={styles.switch}>
        {EDITION_IDS.map((id) => {
          const { name, accent, sub } = copy.editions[id];
          return (
            <label key={id} className={cx(styles.edition, id === edition && styles.on)}>
              <input type="radio" name="edition" className="visually-hidden" checked={id === edition} onChange={() => setEdition(id)} />
              <span className={text('optionTitle')}>
                {name}
                {accent && <span className={styles.accent}>{accent}</span>}
              </span>
              <span className={cx(styles.sub, text('small'))}>{sub}</span>
            </label>
          );
        })}
      </div>

      <div className={styles.hero}>
        {/* A static export serves public/ as is, so a plain img (next/image would need its optimizer). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.art} src={art.src} width={art.width} height={art.height} alt={copy.art[edition]} />
        <p className={cx(styles.tagline, text('hint'))}>
          {copy.tagline[edition].map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>

      <div className={styles.actions}>
        <Link href={routes.play} className={styles.quickPlay} onClick={startQuickPlay}>
          <span className={styles.disc}>
            <Icon name="play" />
          </span>
          <span className={styles.quickText}>
            <span className={text('sheetTitle')}>{copy.quickPlay.title}</span>
            <span className={cx(styles.quickDetail, text('small'))}>{quickPlayDetail(config)}</span>
          </span>
          <Icon name="chevronRight" className={styles.chevron} />
        </Link>

        <div className={styles.tiles}>
          <button type="button" className={styles.tile} onClick={() => setDiving(true)} aria-haspopup="dialog">
            <HomeTileText icon="target" title={copy.deepDive.title} detail={copy.deepDive.detail[edition]} />
          </button>
          <Link href={routes.customGame(config.defaults.mode)} className={styles.tile}>
            <HomeTileText icon="swap" title={copy.customGame.title} detail={copy.customGame.detail} />
          </Link>
        </div>

        <nav aria-label={copy.links.label} className={styles.links}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={cx(styles.link, text('label'))}>
              <Icon name={link.icon} className={styles.linkIcon} />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {diving && <DeepDiveSheet onClose={() => setDiving(false)} onStart={startDeepDive} />}
    </Screen>
  );
}

// A white tile's icon box, title (one line) and line under it.
function HomeTileText({ icon, title, detail }: { icon: IconName; title: string; detail: string }) {
  return (
    <>
      <span className={styles.tileIcon}>
        <Icon name={icon} />
      </span>
      <span className={styles.tileText}>
        <span className={cx(styles.tileTitle, text('optionTitle'))}>{title}</span>
        <span className={cx(styles.muted, text('small'))}>{detail}</span>
      </span>
    </>
  );
}

