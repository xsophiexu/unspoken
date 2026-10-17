'use client';

import { en, type SpotlightTarget } from '@unspoken/content';
import { captionPlacement, tourGesture, type SpotRect } from '@unspoken/core';
import { layout, motion, space, spotlight, tourStepsFor, type LayoutStyle } from '@unspoken/design-tokens';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

import styles from './Spotlight.module.css';

type SpotlightProps = {
  // The play screen, where the steps find their targets by data-spot.
  rootRef: RefObject<HTMLElement | null>;
  onDone: () => void;
  // The player's style: without a difficulty button in the top row it skips that step.
  layoutStyle: LayoutStyle;
};

function findTarget(root: HTMLElement | null, target: SpotlightTarget | null, play: HTMLElement | null): HTMLElement | null {
  if (target === 'play') return play;
  if (!target || !root) return null;
  return root.querySelector<HTMLElement>(`[data-spot="${target}"]`);
}

type Frame = { width: number; height: number; floor: number };

// How to play, as drawn on the canvas: a dark spotlight with white captions. The cut-out glides to
// the part of the screen each caption is about. A tap or click, a swipe left or up, a scroll down or
// right (wheel or trackpad) or the right arrow moves forward; a swipe right or down, a scroll up or
// left or the left arrow goes back; Play (always there) ends the tour. Nothing moves on its own.
export function Spotlight({ rootRef, onDone, layoutStyle }: SpotlightProps) {
  const [steps] = useState(() => tourStepsFor(en.howToPlay.steps, layoutStyle));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLOListElement>(null);
  // Where the current pointer went down, to tell a tap from a swipe.
  const pointer = useRef<{ x: number; y: number } | null>(null);
  // A swipe ends in a click too; this drops that click.
  const swiped = useRef(false);
  // A scroll gesture fires many wheel events; one step per gesture.
  const wheelAt = useRef(Number.NEGATIVE_INFINITY);
  const [index, setIndex] = useState(0);
  // The cut-out, in the dialog's coordinates.
  const [hole, setHole] = useState<SpotRect | null>(null);
  // The dialog's size, and the top of the dots over Play: captions never reach below it.
  const [frame, setFrame] = useState<Frame>({ width: 0, height: 0, floor: 0 });
  const step = steps[index] ?? steps[0]!;
  const forward = () => setIndex((i) => Math.min(steps.length - 1, i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
    // Focus starts on Play for keyboards, without drawing the focus ring over the design.
    playRef.current?.focus({ focusVisible: false } as FocusOptions);
    return () => dialog?.close?.();
  }, []);

  // Measure the target against the dialog itself, and again whenever anything could move it: a
  // resize or rotation, a scroll, the on-screen keyboard, fonts arriving, or the target or the play
  // screen changing size (a fitted word, a style change).
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const measure = () => {
      const origin = dialog?.getBoundingClientRect() ?? { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      const width = origin.width || window.innerWidth;
      const height = origin.height || window.innerHeight;
      const dots = dotsRef.current?.getBoundingClientRect();
      const floor = dots && dots.height > 0 ? dots.top - origin.top : height;
      setFrame((f) => (f.width === width && f.height === height && f.floor === floor ? f : { width, height, floor }));
      const el = findTarget(rootRef.current, step.target, playRef.current);
      const r = el?.getBoundingClientRect();
      if (!r || r.width === 0 || r.height === 0) return setHole(null);
      const pad = spotlight.padding;
      const next = { x: r.left - origin.left - pad, y: r.top - origin.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
      setHole((h) => (h && h.x === next.x && h.y === next.y && h.w === next.w && h.h === next.h ? h : next));
    };
    measure();
    let frameId = 0;
    const schedule = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    const el = findTarget(rootRef.current, step.target, playRef.current);
    [el, rootRef.current].forEach((node) => node && observer?.observe(node));
    void document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [rootRef, step.target]);

  // With nothing to point at, the cut-out shrinks to the middle and the caption sits there.
  const cut = hole ?? { x: frame.width / 2, y: frame.height / 2, w: 0, h: 0 };
  const place = hole ? captionPlacement(hole, { ...frame, side: layout.play.paddingX, gap: space[4], maxShare: spotlight.captionMaxShare }) : null;
  const captionStyle: CSSProperties = place
    ? { left: place.left, right: place.right, top: place.top, bottom: place.bottom }
    : { top: '50%', transform: 'translateY(-50%)' };

  return (
    <dialog
      ref={dialogRef}
      className={styles.tour}
      aria-label={en.menu.howToPlay.title}
      onCancel={(event) => {
        event.preventDefault();
        onDone();
      }}
      onPointerDown={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY };
        swiped.current = false;
      }}
      onPointerUp={(event) => {
        const start = pointer.current;
        pointer.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        const slop = space[3];
        // Taps are left to the click; a swipe moves here and drops the click that follows it.
        if (Math.abs(dx) < slop && Math.abs(dy) < slop) return;
        swiped.current = true;
        const move = tourGesture(dx, dy, { slop, swipe: layout.minTouch });
        if (move === 'back') back();
        else if (move === 'forward') forward();
      }}
      onClick={(event) => {
        const drop = swiped.current;
        swiped.current = false;
        if (drop || playRef.current?.contains(event.target as Node)) return;
        forward();
      }}
      onWheel={(event) => {
        const now = event.timeStamp;
        if (now - wheelAt.current < motion.spotlight.moveMs) return;
        const along = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(along) < space[4]) return;
        wheelAt.current = now;
        if (along < 0) back();
        else forward();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') back();
        else if (event.key === 'ArrowRight') forward();
        else return;
        event.preventDefault();
      }}
    >
      <div
        className={cx(styles.hole, !hole && styles.noTarget)}
        style={{ left: cut.x, top: cut.y, width: cut.w, height: cut.h }}
        aria-hidden="true"
      />
      {/* Keyed by step, so each caption fades in as its cut-out arrives. */}
      <div
        key={step.id}
        className={cx(styles.caption, place ? styles.beside : styles.centered, place ? styles[place.align] : styles.center)}
        style={captionStyle}
        aria-live="polite"
      >
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
          {steps.map((st, i) => (
            <li key={st.id} className={cx(styles.dot, i === index && styles.active)} />
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
