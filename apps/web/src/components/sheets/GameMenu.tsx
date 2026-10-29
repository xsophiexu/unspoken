'use client';

import { en, mdEn } from '@unspoken/content';
import { format, menuStatus, type RoundState } from '@unspoken/core';
import { gameMenu } from '@unspoken/design-tokens';
import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MenuRow } from '@/components/ui/MenuRow';
import { Sheet } from '@/components/ui/Sheet';
import { catalogFor } from '@/lib/catalog';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useEdition } from '@/state/edition';
import { useTheme } from '@/state/theme';

import { SheetHead } from './SheetHead';
import styles from './sheets.module.css';

type GameMenuProps = {
  round: RoundState;
  // The sliders button opens the same menu with Customize first.
  customizeFirst: boolean;
  onClose: () => void;
  onRestart: () => void;
  // How to play tours the swipe screen; absent where it doesn't apply.
  onHowToPlay?: () => void;
  // Called before a row opens another screen.
  onLeave: () => void;
};

// The ··· menu ("Game paused"): an i for How to play beside the title, rows for settings, customize,
// feedback and Home, then Resume. Restart sits beside Resume (the narrower of the pair) or, with
// gameMenu.restartPlacement 'header', as a compact button at the top right.
export function GameMenu({ round, customizeFirst, onClose, onRestart, onHowToPlay, onLeave }: GameMenuProps) {
  const id = useId();
  const { theme } = useTheme();
  const { look } = useEdition();
  const m = en.menu;
  // UnspokenMD has no color choice: its row names the Look, and its picks are specialties.
  const md = round.config.edition === 'md';
  const style = en.customize.styles[theme.selection.style];
  const customizeDetail = md
    ? format(mdEn.menu.customize, { style, look: en.md.customize.looks[look] })
    : format(m.customize.detail, { style, color: en.customize.colors[theme.color] });
  const customize = <MenuRow key="customize" title={m.customize.title} detail={customizeDetail} href={routes.customize} onClick={onLeave} />;
  const settings = <MenuRow key="settings" title={m.changeSettings.title} detail={md ? mdEn.menu.changeSettings : m.changeSettings.detail} href={routes.modes} onClick={onLeave} />;
  const feedback = <MenuRow key="feedback" title={m.feedback.title} detail={md ? mdEn.menu.feedback : m.feedback.detail} href={routes.feedback('menu')} onClick={onLeave} />;
  const home = <MenuRow key="home" title={m.home.title} detail={m.home.detail} href={routes.home} onClick={onLeave} />;
  const rows = customizeFirst ? [customize, settings, feedback, home] : [settings, customize, feedback, home];
  const help = onHowToPlay && <InfoButton label={m.howToPlay.title} onClick={onHowToPlay} />;
  const inHeader = gameMenu.restartPlacement === 'header';
  // Shows the short label in either place; its name stays "Restart game".
  const restart = (
    <Button variant="secondary" size={inHeader ? 'compact' : 'large'} icon="restart" aria-label={m.restart} onClick={onRestart}>
      {m.restartShort}
    </Button>
  );
  const resume = (
    <Button size="large" icon="play" onClick={onClose}>
      {m.resume}
    </Button>
  );
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={m.title} note={menuStatus(round, catalogFor(round.config).copy)} action={help} end={inHeader && restart} />
      <div className={styles.rows}>{rows}</div>
      {inHeader ? (
        <div className={styles.footer}>{resume}</div>
      ) : (
        <div className={styles.buttonPair}>
          {restart}
          {resume}
        </div>
      )}
    </Sheet>
  );
}

// A quiet i beside the title, with a small tooltip on hover and keyboard focus. The tooltip repeats
// the button's name, so screen readers skip it.
function InfoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <span className={styles.info}>
      <button type="button" aria-label={label} className={styles.infoButton} onClick={onClick}>
        <Icon name="info" />
      </button>
      <span className={cx(styles.tooltip, text('small'))} aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
