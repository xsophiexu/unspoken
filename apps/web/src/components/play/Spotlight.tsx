'use client';

import { en, type SpotlightTarget } from '@unspoken/content';
import { motion, spotlight } from '@unspoken/design-tokens';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

import styles from './Spotlight.module.css';

type SpotlightProps = {
  // The play screen, where the steps find their targets by data-spot.
  rootRef: RefObject<HTMLElement | null>;
  onDone: () => void;
};

type Box = { top: number; left: number; width: number; height: number };

const steps = en.howToPlay.steps;

function findTarget(root: HTMLElement | null, target: SpotlightTarget | null, play: HTMLElement | null): HTMLElement | null {
  if (target === 'play') return play;
  if (!target || !root) return null;
  return root.querySelector<HTMLElement>(`[data-spot="${target}"]`);
}

// How to play: the original dark spotlight. Seven captions step by themselves; the cut-out glides
// to the part of the screen each one is about, and Play (always there) ends the tour.
export function Spotlight({ rootRef, onDone }: SpotlightProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const step = steps[index] ?? steps[0]!;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
    playRef.current?.focus();
    return () => dialog?.close?.();
  }, []);

  useEffect(() => {
    if (index >= steps.length - 1) return;
    const id = window.setTimeout(() => setIndex((i) => i + 1), motion.spotlight.stepMs);
    return () => window.clearTimeout(id);
  }, [index]);

  useLayoutEffect(() => {
    const measure = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const el = findTarget(rootRef.current, step.target, playRef.current);
      if (!el) return setBox(null);
      const r = el.getBoundingClientRect();
      const pad = spotlight.padding;
      setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rootRef, step.target]);

  // With nothing to point at, the cut-out shrinks to the middle and the caption sits there.
  const hole: Box = box ?? { top: viewport.height / 2, left: viewport.width / 2, width: 0, height: 0 };
  const caption = captionPlacement(box, viewport);

  return (
    <dialog
      ref={dialogRef}
      className={styles.tour}
      aria-label={en.menu.howToPlay.title}
      onCancel={(event) => {
        event.preventDefault();
        onDone();
      }}
    >
      <div className={cx(styles.hole, !box && styles.noTarget)} style={hole} aria-hidden="true" />
      <div className={cx(styles.caption, styles[caption.align])} style={caption.style} aria-live="polite">
        {step.art === 'logo' && (
          <p className={cx(styles.logo, text('headline'))}>
            <Icon name="bubble" />
            <span className={styles.wordmark}>{en.app.name.toLowerCase()}</span>
          </p>
        )}
        {step.art === 'mic' && (
          <span className={styles.mic}>
            <Icon name="mic" />
          </span>
        )}
        <p className={text(step.art === 'logo' ? 'lead' : 'caption')}>{step.text}</p>
      </div>
      <div className={styles.bottom}>
        <ol className={styles.dots} aria-hidden="true">
          {steps.map((s, i) => (
            <li key={s.id} className={cx(styles.dot, i === index && styles.active)} />
          ))}
        </ol>
        <button
          ref={playRef}
          type="button"
          className={cx(styles.play, text('buttonStrong'), step.target === 'play' && styles.pulse)}
          onClick={onDone}
        >
          <Icon name="play" />
          {en.howToPlay.play}
        </button>
      </div>
    </dialog>
  );
}

type Placement = { align: 'start' | 'center' | 'end'; style: CSSProperties };

// Under the target when there is more room below, over it otherwise; lined up with whichever side
// of the screen the target is on.
function captionPlacement(box: Box | null, viewport: { width: number; height: number }): Placement {
  if (!box) return { align: 'center', style: { top: '50%', transform: 'translateY(-50%)' } };
  const gap = spotlight.padding * 2;
  const centerX = box.left + box.width / 2;
  const third = viewport.width / 3;
  const align = centerX < third ? 'start' : centerX > third * 2 ? 'end' : 'center';
  const below = viewport.height - (box.top + box.height) > box.top;
  return { align, style: below ? { top: box.top + box.height + gap } : { bottom: viewport.height - box.top + gap } };
}
