'use client';

import { en, type SpotlightTarget } from '@unspoken/content';
import { motion, space, spotlight } from '@unspoken/design-tokens';
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

// How to play, as drawn on the canvas: a dark spotlight with white captions. Seven captions step by
// themselves; the cut-out glides to the part of the screen each one is about, and Play (always
// there) ends the tour.
export function Spotlight({ rootRef, onDone }: SpotlightProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  // The viewport, and the top of the dots over Play: captions never reach below it.
  const [viewport, setViewport] = useState({ width: 0, height: 0, floor: 0 });
  const step = steps[index] ?? steps[0]!;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
    // Focus starts on Play for keyboards, without drawing the focus ring over the design.
    playRef.current?.focus({ focusVisible: false } as FocusOptions);
    return () => dialog?.close?.();
  }, []);

  useEffect(() => {
    if (index >= steps.length - 1) return;
    const id = window.setTimeout(() => setIndex((i) => i + 1), motion.spotlight.stepMs);
    return () => window.clearTimeout(id);
  }, [index]);

  useLayoutEffect(() => {
    const measure = () => {
      const floor = dotsRef.current?.getBoundingClientRect().top || window.innerHeight;
      setViewport({ width: window.innerWidth, height: window.innerHeight, floor });
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
        {step.art === 'logo' && <p className={cx(styles.wordmark, text('wordmark'))}>{en.app.name.toLowerCase()}</p>}
        {step.art === 'mic' && (
          <span className={styles.mic}>
            <Icon name="mic" />
          </span>
        )}
        <p className={text(step.art === 'logo' ? 'lead' : 'caption')}>{step.text}</p>
        {step.rules && (
          <ul className={cx(styles.rules, text('rule'))}>
            {step.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.bottom}>
        <ol ref={dotsRef} className={styles.dots} aria-hidden="true">
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

// Under the target when there is more room below, over it otherwise.
function captionPlacement(box: Box | null, viewport: { width: number; height: number; floor: number }): Placement {
  if (!box) return { align: 'center', style: { top: '50%', transform: 'translateY(-50%)' } };
  const gap = spotlight.padding + space[4];
  // Captions read from the left, except beside a target on the right edge (the menu button).
  const align = box.left + box.width / 2 > (viewport.width * 2) / 3 ? 'end' : 'start';
  const below = viewport.height - (box.top + box.height) > box.top;
  // Over Play, the caption sits above the dots.
  const over = Math.min(box.top, viewport.floor);
  return { align, style: below ? { top: box.top + box.height + gap } : { bottom: viewport.height - over + gap } };
}
