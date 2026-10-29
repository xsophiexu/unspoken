'use client';

import { en, mdEn } from '@unspoken/content';
import { EDITION_IDS, difficultyLabel, format, isSwipeOver, type EditionId, type GameSettings, type RoundState } from '@unspoken/core';
import Link from 'next/link';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { homeArt } from '@/lib/art';
import { catalogs } from '@/lib/catalog';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useEdition } from '@/state/edition';
import { useGame } from '@/state/game';

import styles from './HomeScreen.module.css';

const copy = en.home;
const difficultyNames = Object.fromEntries(Object.entries(en.difficulties).map(([id, d]) => [id, d.name])) as Record<keyof typeof en.difficulties, string>;

// Quick Play's line: the mode and difficulty it will play, on one phone. UnspokenMD's Quick Play
// always plays Zen, with its last settings.
function quickPlayDetail(edition: EditionId, settings: GameSettings): string {
  const { config } = catalogs[edition];
  const mode = edition === 'md' ? mdEn.modes.zen.name : en.modes[settings.mode].name;
  const difficulty = difficultyLabel(settings.difficulties, { names: difficultyNames, mixed: en.difficultyMix }, config);
  return format(copy.quickPlay.detail, { mode, where: copy.quickPlay.onePhone, difficulty });
}

// Whether UnspokenMD's Quick Play can carry on with the game in progress: a Zen game not over yet.
function zenInProgress(round: RoundState): boolean {
  return round.kind === 'swipe' && round.rules.optionalRules === true && !isSwipeOver(round);
}

const links: { href: string; icon: IconName; label: string }[] = [
  { href: routes.modes, icon: 'grid', label: copy.links.modes },
  { href: routes.customize, icon: 'brush', label: copy.links.customize },
  { href: routes.howToPlay, icon: 'help', label: copy.links.howToPlay },
];

// Home (home-v4, screens 1 and 2): the edition switch, the fox holding the edition's card, Quick
// Play with the last settings, and links to Modes, Customize and How to play.
export function HomeScreen() {
  const { edition, setEdition } = useEdition();
  const { settings, round, newGame } = useGame();
  // UnspokenMD's Quick Play skips setup and starts Zen with the last settings; Unspoken's opens the
  // game as it is.
  const startQuickPlay = () => {
    if (edition === 'md' && !zenInProgress(round)) newGame({ ...settings, mode: 'zen' }, undefined, 'quickPlay');
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
            <span className={cx(styles.quickDetail, text('small'))}>{quickPlayDetail(edition, settings)}</span>
          </span>
          <Icon name="chevronRight" className={styles.chevron} />
        </Link>

        <nav aria-label={copy.links.label} className={styles.links}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={cx(styles.link, text('label'))}>
              <Icon name={link.icon} className={styles.linkIcon} />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </Screen>
  );
}

