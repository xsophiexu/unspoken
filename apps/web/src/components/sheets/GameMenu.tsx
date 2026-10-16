'use client';

import { en } from '@unspoken/content';
import { format, menuStatus, type RoundState } from '@unspoken/core';
import { resolveTheme } from '@unspoken/design-tokens';
import { useId } from 'react';

import { Button, IconButton } from '@/components/ui/Button';
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

// The ··· menu ("Game paused"): a ? for How to play beside the title, rows for settings, customize
// and feedback, then Restart game and Resume side by side.
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
  const help = onHowToPlay && <IconButton icon="question" label={m.howToPlay.title} look="filled" className={styles.help} onClick={onHowToPlay} />;
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={m.title} note={menuStatus(round, en)} action={help} />
      <div className={styles.rows}>{rows}</div>
      <div className={styles.split}>
        <Button variant="secondary" size="large" icon="restart" onClick={onRestart}>
          {m.restart}
        </Button>
        <Button size="large" icon="play" onClick={onClose}>
          {m.resume}
        </Button>
      </div>
    </Sheet>
  );
}
