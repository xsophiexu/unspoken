import { en, mdEn } from '@unspoken/content';
import { format } from '@unspoken/core';
import type { HeaderSlot } from '@unspoken/design-tokens';

import { IconButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

import type { HeaderModel } from './model';
import styles from './Header.module.css';

type HeaderProps = {
  slot: HeaderSlot;
  // The frame renders the header at both anchors; it shows at the one its config names.
  at: HeaderSlot['position'];
  model: HeaderModel;
  // The status line under the title (styles whose stats sit in the subline).
  withSubline: boolean;
  // Pill, caps and inline headers open the mode and difficulty sheet; the Card badge opens the
  // difficulty picker. Absent in previews.
  onOpen?: () => void;
};

// The mode and level. Card shows a big title with a filled level badge; the other styles show
// "Mode · Level ▾" as a pill, small caps or plain text.
export function Header({ slot, at, model, withSubline, onOpen }: HeaderProps) {
  if (slot.position !== at) return null;
  const { modeName, difficulty } = model;
  const subline = withSubline && <p className={cx(styles.subline, text('subline'))}>{model.subline}</p>;

  if (slot.variant === 'titleBadge') {
    return (
      <div className={styles.titleBlock}>
        <div className={cx(styles.titleRow, model.longBadge && styles.longBadge)}>
          <span className={cx(styles.title, text('modeName'))} style={{ fontSize: slot.size }}>
            {modeName}
          </span>
          <button
            type="button"
            className={cx(styles.badge, text('badge'))}
            onClick={onOpen}
            tabIndex={onOpen ? undefined : -1}
            aria-label={difficulty.label ?? format(en.a11y.difficulty, { badge: difficulty.name })}
            data-spot="difficulty"
          >
            {difficulty.badge}
            <Icon name="caret" className={styles.badgeCaret} />
          </button>
        </div>
        {subline}
      </div>
    );
  }

  return (
    <div className={styles.titleBlock}>
      <button
        type="button"
        className={cx(styles.switch, styles[slot.variant], styles[`container-${slot.container}`])}
        style={{ fontSize: slot.size }}
        onClick={onOpen}
        tabIndex={onOpen ? undefined : -1}
        aria-label={format(en.a11y.modeAndDifficulty, { mode: modeName, difficulty: difficulty.name })}
        data-spot="difficulty"
      >
        <span className={styles.mode}>{modeName}</span>
        <span className={styles.separator} aria-hidden="true" />
        <span className={styles.level}>{difficulty.name}</span>
        <Icon name="caret" className={styles.caret} />
      </button>
      {subline}
    </div>
  );
}

// compact: the button is only as big as its circle (layout.header.menuButton), with the touch
// target still the full minimum size around it (UnspokenMD's search and ··· side by side).
type MenuButtonProps = { slot: HeaderSlot; onMenu?: () => void; compact?: boolean };

// Dots open the game menu; sliders open it with Customize first.
export function MenuButton({ slot, onMenu, compact = false }: MenuButtonProps) {
  return (
    <IconButton
      icon={slot.menu}
      look={slot.menuContainer}
      label={slot.menu === 'sliders' ? en.a11y.customize : en.a11y.menu}
      onClick={onMenu}
      tabIndex={onMenu ? undefined : -1}
      className={compact ? styles.compactButton : styles[`menu-${slot.menuContainer}`]}
      data-spot="menu"
    />
  );
}

// UnspokenMD's search, beside a compact menu in the same look: opens Find a card.
export function SearchButton({ slot, onSearch }: { slot: HeaderSlot; onSearch: () => void }) {
  return <IconButton icon="search" look={slot.menuContainer} label={mdEn.play.search} onClick={onSearch} className={styles.compactButton} />;
}
