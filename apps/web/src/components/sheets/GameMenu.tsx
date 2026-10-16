'use client';

import { en } from '@unspoken/content';
import { format, menuStatus, type RoundState } from '@unspoken/core';
import { resolveTheme } from '@unspoken/design-tokens';
import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { MenuRow } from '@/components/ui/MenuRow';
import { Sheet } from '@/components/ui/Sheet';
import { routes } from '@/lib/routes';
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

// The ··· menu: restart, change settings, customize, feedback and How to play.
export function GameMenu({ round, customizeFirst, onClose, onRestart, onHowToPlay, onLeave }: GameMenuProps) {
  const id = useId();
  const { selection } = useTheme();
  const theme = resolveTheme(selection);
  const customize = (
    <MenuRow
      key="customize"
      title={en.menu.customize.title}
      detail={format(en.menu.customize.detail, { style: en.customize.styles[selection.style], color: en.customize.colors[theme.color] })}
      href={routes.customize}
      onClick={onLeave}
    />
  );
  const rows = [
    <MenuRow key="restart" title={en.menu.restart.title} detail={en.menu.restart.detail} onClick={onRestart} />,
    <MenuRow
      key="settings"
      title={en.menu.changeSettings.title}
      detail={format(en.menu.changeSettings.detail, { mode: en.modes[round.settings.mode].name })}
      href={routes.modes}
      onClick={onLeave}
    />,
    customize,
    <MenuRow key="feedback" title={en.menu.feedback.title} detail={en.menu.feedback.detail} href={routes.feedback('menu')} onClick={onLeave} />,
    onHowToPlay && <MenuRow key="howto" title={en.menu.howToPlay.title} detail={en.menu.howToPlay.detail} onClick={onHowToPlay} />,
  ];
  const ordered = customizeFirst ? [customize, ...rows.filter((row) => row !== customize)] : rows;
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={en.menu.title} note={menuStatus(round, en)} />
      <div className={styles.rows}>{ordered}</div>
      <div className={styles.actions}>
        <Button size="large" onClick={onClose}>
          {en.menu.resume}
        </Button>
      </div>
    </Sheet>
  );
}
