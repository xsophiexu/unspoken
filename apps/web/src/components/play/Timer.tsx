import { en } from '@unspoken/content';
import { layout, textStyles, type TimerBar, type TimerSlot } from '@unspoken/design-tokens';
import type { CSSProperties, ReactNode } from 'react';

import { IconButton } from '@/components/ui/Button';
import type { Size } from '@/lib/hooks';
import { cx, text } from '@/lib/ui';

import type { ClockModel } from './model';
import styles from './Timer.module.css';

// Where in the frame a piece of the timer can sit.
export type TimerAnchor = 'ring' | 'header' | 'top' | 'belowWord' | 'panelTop' | 'aboveControls';

const barAnchor: Record<TimerBar['placement'], TimerAnchor> = {
  belowHeader: 'top',
  belowClock: 'top',
  belowWord: 'belowWord',
  panelTop: 'panelTop',
  aboveControls: 'aboveControls',
};

type TimerProps = {
  slot: TimerSlot;
  at: TimerAnchor;
  clock: ClockModel | null;
  onPause?: () => void;
  // The ring's box (ringCard frame).
  box?: Size;
};

// The box behind a clock label: none, or one of the region fills (TimerSlot.fill).
function fillClass(fill: NonNullable<TimerSlot['fill']>): string | undefined {
  return fill === 'none' ? undefined : styles[`fill-${fill}`];
}

// The round clock in one of five looks. The frame renders <Timer> at every anchor; each look shows
// its parts where its config places them and nothing elsewhere.
export function Timer({ slot, at, clock, onPause, box }: TimerProps) {
  if (!clock) return null;
  const progress = { '--progress': clock.progress } as CSSProperties;
  // slot.vivid: the clock digits and the progress line in the region's vivid color.
  const vivid = slot.vivid && styles.vivid;
  const bar = slot.bar && barAnchor[slot.bar.placement] === at ? <Bar bar={slot.bar} progress={progress} className={vivid} /> : null;
  const pause = <Pause onPause={onPause} />;
  const label = <ClockLabel clock={clock} />;

  switch (slot.variant) {
    case 'ring':
      return at === 'ring' && box ? <Ring clock={clock} box={box} pause={pause} fill={fillClass(slot.fill ?? 'none')} /> : null;
    case 'chip':
      return at === 'header' ? <ClockChip clock={clock} onPause={onPause} fill={slot.fill ?? 'outlined'} /> : bar;
    case 'dial': {
      if (at !== 'header') return bar;
      const size = slot.size ?? layout.header.menuButton;
      return (
        <button
          type="button"
          className={cx(styles.dial, text('clock'))}
          style={{ ...progress, width: size, height: size }}
          onClick={onPause}
          tabIndex={onPause ? undefined : -1}
          aria-label={en.a11y.pause}
        >
          <span className={styles.dialFace}>{label}</span>
        </button>
      );
    }
    case 'bigClock':
      if (at !== 'top') return null;
      return (
        <div className={styles.stack}>
          <div className={cx(styles.bigRow, vivid)}>
            {pause}
            <span className={text('bigClock')} style={{ fontSize: slot.size }}>
              {label}
            </span>
          </div>
          {bar}
        </div>
      );
    case 'bar': {
      if (!bar || !slot.bar) return null;
      const clockAt = slot.clockAt ?? 'end';
      const size = slot.size ?? textStyles.clock.size;
      const clockRow =
        clockAt === 'none' ? (
          <div className={cx(styles.clockRow, styles.end)}>{pause}</div>
        ) : (
          <div className={cx(styles.clockRow, styles[clockAt], vivid, text(size >= textStyles.clockLight.size ? 'clockLight' : 'clock'))} style={{ fontSize: size }}>
            {label}
            {pause}
          </div>
        );
      // Under the word, the clock sits beside the bar; elsewhere it gets its own row, above the bar
      // when the bar runs along the panel's top edge or under the clock, below it otherwise.
      if (slot.bar.placement === 'belowWord') {
        return (
          <div className={styles.inline}>
            {bar}
            {clockRow}
          </div>
        );
      }
      const clockFirst = slot.bar.placement === 'belowClock' || slot.bar.placement === 'panelTop';
      return (
        <div className={styles.stack}>
          {clockFirst && clockRow}
          {bar}
          {!clockFirst && clockRow}
        </div>
      );
    }
  }
}

type ClockChipProps = { clock: ClockModel; onPause?: () => void; fill: NonNullable<TimerSlot['fill']>; className?: string; style?: CSSProperties };

// The clock and pause button in a pill (the chip timer, and the Halloween looks' time pill).
export function ClockChip({ clock, onPause, fill, className, style }: ClockChipProps) {
  return (
    <span className={cx(styles.chip, fillClass(fill), text('clock'), className)} style={style}>
      <ClockLabel clock={clock} />
      <Pause onPause={onPause} />
    </span>
  );
}

function ClockLabel({ clock }: { clock: ClockModel }) {
  return (
    <span role="timer" aria-label={clock.label} className={styles.clockText}>
      {clock.label}
    </span>
  );
}

function Pause({ onPause }: { onPause?: () => void }) {
  return <IconButton icon="pause" label={en.a11y.pause} onClick={onPause} tabIndex={onPause ? undefined : -1} className={styles.pause} />;
}

function Bar({ bar, progress, className }: { bar: TimerBar; progress: CSSProperties; className?: string | false }) {
  return (
    <div className={cx(styles.track, bar.bleed && styles.bleed, className)} style={{ ...progress, height: bar.thickness }} aria-hidden="true">
      <div className={styles.fill} />
    </div>
  );
}

// The Card timer: progress runs around the word tile from the left of a gap at the top, where the
// clock and pause button sit (with no box behind them for fill 'none'). Drawn to the measured box so
// it fits any screen.
function Ring({ clock, box, pause, fill }: { clock: ClockModel; box: Size; pause: ReactNode; fill?: string }) {
  const { ringStroke: stroke, ringRadius: r, ringGap: gap } = layout.card;
  const { width: w, height: h } = box;
  const [left, top, right, bottom] = [stroke / 2, stroke / 2, w - stroke / 2, h - stroke / 2];
  const d = [
    `M${w / 2 - gap / 2} ${top}`,
    `H${left + r}`,
    `A${r} ${r} 0 0 0 ${left} ${top + r}`,
    `V${bottom - r}`,
    `A${r} ${r} 0 0 0 ${left + r} ${bottom}`,
    `H${right - r}`,
    `A${r} ${r} 0 0 0 ${right} ${bottom - r}`,
    `V${top + r}`,
    `A${r} ${r} 0 0 0 ${right - r} ${top}`,
    `H${w / 2 + gap / 2}`,
  ].join(' ');
  return (
    <>
      <svg className={styles.ring} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path d={d} className={styles.ringTrack} strokeWidth={stroke} />
        <path d={d} className={styles.ringFill} strokeWidth={stroke} pathLength={100} strokeDasharray={`${clock.progress * 100} 100`} />
      </svg>
      <div className={cx(styles.ringClock, fill, text('clock'))}>
        <ClockLabel clock={clock} />
        {pause}
      </div>
    </>
  );
}
