'use client';

import { en } from '@unspoken/content';
import { format, menuStatus, type RoundState } from '@unspoken/core';
import { gameMenu, resolveTheme } from '@unspoken/design-tokens';
import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MenuRow } from '@/components/ui/MenuRow';
import { Sheet } from '@/components/ui/Sheet';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
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

// The ··· menu ("Game paused"): an i for How to play beside the title, rows for settings, customize
// and feedback, then Resume. Restart sits beside Resume (the narrower of the pair) or, with
// gameMenu.restartPlacement 'header', as a compact button at the top right.
export function GameMenu({ round, customizeFirst, onClose, onRestart, onHowToPlay, onLeave }: GameMenuProps) {
  const id = useId();
  const { selection } = useTheme();
  const theme = resolveTheme(selection);
  const m = en.menu;
  const customize = (
    <MenuRow
      key="customize"
      title={m.customize.title}
      detail={format(m.customize.detail, { style: en.customize.styles[selection.style], color: en.customize.colors[theme.color] })}
      href={routes.customize}
      onClick={onLeave}
    />
  );
  const settings = <MenuRow key="settings" title={m.changeSettings.title} detail={m.changeSettings.detail} href={routes.modes} onClick={onLeave} />;
  const feedback = <MenuRow key="feedback" title={m.feedback.title} detail={m.feedback.detail} href={routes.feedback('menu')} onClick={onLeave} />;
  const rows = customizeFirst ? [customize, settings, feedback] : [settings, customize, feedback];
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
      <SheetHead id={id} title={m.title} note={menuStatus(round, en)} action={help} end={inHeader && restart} />
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
