'use client';

import { motion } from '@unspoken/design-tokens';
import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type RefObject } from 'react';

import { useReducedMotion } from '@/lib/hooks';

export type SwipeAnswer = 'skip' | 'correct';

type SwipeOptions = {
  // The frame that holds the swipeable parts; the drag is written to it as CSS variables.
  frameRef: RefObject<HTMLElement | null>;
  // Whether each answer is allowed right now (both false while paused, over or behind a sheet).
  can: Record<SwipeAnswer, boolean>;
  onAnswer: (answer: SwipeAnswer) => void;
  // Changes with every card; the idle nudge restarts its wait when it does.
  cardKey: string | null;
  // false: the style's card doesn't swipe (cardSwipes). No drag and no hint; answer() still works.
  drags?: boolean;
};

type Drag = { id: number; x: number; y: number; dx: number; active: boolean };

// 'hint' slides the card out for the swipe hint, 'hintBack' springs it back; both show "› SWIPE".
type Phase = 'drag' | 'settle' | 'fly' | 'hint' | 'hintBack';

const { swipe, hint } = motion;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// The drag as CSS variables on the frame: --drag-x moves the swipeable parts, --drag-rot tilts the
// card, --drag-p is the progress toward an answer, and --drag-bar how far the bars have stretched.
function setDrag(el: HTMLElement, dx: number, phase: Phase | null) {
  el.style.setProperty('--drag-x', `${dx}px`);
  el.style.setProperty('--drag-rot', `${clamp(dx / swipe.tiltAtPx, -1, 1) * swipe.maxTiltDeg}deg`);
  el.style.setProperty('--drag-p', String(clamp(dx / swipe.thresholdPx, -1, 1)));
  el.style.setProperty('--drag-bar', String(clamp(dx / swipe.barRangePx, -1, 1)));
  if (phase) el.dataset.drag = phase;
  else delete el.dataset.drag;
  if (dx < 0) el.dataset.dragDir = 'skip';
  else if (dx > 0) el.dataset.dragDir = 'correct';
  else delete el.dataset.dragDir;
}

// Swipe right for Correct and left for Skip. The card follows the pointer; past the threshold it
// flies off and the answer is sent, otherwise it settles back. Buttons and keys use answer(), which
// plays the same fly-off. With reduced motion, answers apply at once.
export function useSwipe({ frameRef, can, onAnswer, cardKey, drags = true }: SwipeOptions) {
  const reduced = useReducedMotion();
  const drag = useRef<Drag | null>(null);
  const flying = useRef(false);
  const timers = useRef<number[]>([]);
  const latest = useRef({ can, onAnswer });
  useEffect(() => {
    latest.current = { can, onAnswer };
  });

  // A swipe or tap ends the opening hint and restarts the idle wait.
  const firstNudge = useRef(true);
  const [idle, setIdle] = useState(0);
  const touched = useCallback(() => {
    firstNudge.current = false;
    setIdle((n) => n + 1);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const answer = useCallback(
    (kind: SwipeAnswer) => {
      const el = frameRef.current;
      if (flying.current || !latest.current.can[kind]) return;
      if (reduced || !el) {
        latest.current.onAnswer(kind);
        return;
      }
      flying.current = true;
      setDrag(el, (kind === 'correct' ? 1 : -1) * swipe.flyDistancePx, 'fly');
      later(() => {
        setDrag(el, 0, null);
        flying.current = false;
        latest.current.onAnswer(kind);
      }, swipe.flyOutMs);
    },
    [frameRef, reduced, later],
  );

  const settle = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    setDrag(el, 0, 'settle');
    later(() => {
      if (el.dataset.drag === 'settle') setDrag(el, 0, null);
    }, motion.duration.base);
  }, [frameRef, later]);

  const enabled = (can.correct || can.skip) && drags;
  const surface = useMemo((): HTMLAttributes<HTMLDivElement> => {
    if (!enabled) return {};
    return {
      onPointerDown: (e) => {
        if (flying.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
        touched();
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, active: false };
      },
      onPointerMove: (e) => {
        const d = drag.current;
        const el = frameRef.current;
        if (!d || d.id !== e.pointerId || !el) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.active) {
          if (Math.abs(dx) < swipe.startSlopPx || Math.abs(dx) < Math.abs(dy)) return;
          d.active = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        // A direction without an answer left (no skips) only gives a little.
        const allowed = latest.current.can[dx < 0 ? 'skip' : 'correct'];
        d.dx = allowed ? dx : clamp(dx, -swipe.startSlopPx, swipe.startSlopPx);
        setDrag(el, d.dx, 'drag');
      },
      onPointerUp: (e) => {
        const d = drag.current;
        drag.current = null;
        if (!d || d.id !== e.pointerId || !d.active) return;
        if (Math.abs(d.dx) >= swipe.thresholdPx) answer(d.dx > 0 ? 'correct' : 'skip');
        else settle();
      },
      onPointerCancel: () => {
        if (drag.current?.active) settle();
        drag.current = null;
      },
    };
  }, [enabled, frameRef, answer, settle, touched]);

  // The swipe hint: the card slides right, tilting and stretching the Correct bar as a drag would,
  // with "› SWIPE" showing from under it, then springs back. It plays soon after the round opens and
  // again after a long spell with no swipe or tap. With reduced motion only the label shows.
  useEffect(() => {
    const el = frameRef.current;
    if (!enabled || !el || cardKey === null) return;
    const steps: number[] = [];
    const at = (fn: () => void, ms: number) => steps.push(window.setTimeout(fn, ms));
    const wait = firstNudge.current ? hint.firstDelayMs : hint.idleMs;
    at(() => {
      if (drag.current || flying.current) return;
      firstNudge.current = false;
      setDrag(el, reduced ? 0 : hint.nudgePx, 'hint');
      at(() => setDrag(el, 0, 'hintBack'), hint.outMs + hint.holdMs);
      at(() => {
        if (el.dataset.drag === 'hintBack') setDrag(el, 0, null);
        setIdle((n) => n + 1);
      }, hint.outMs + hint.holdMs + hint.back.ms);
    }, wait);
    return () => {
      steps.forEach((id) => window.clearTimeout(id));
      if (el.dataset.drag === 'hint' || el.dataset.drag === 'hintBack') setDrag(el, 0, null);
    };
  }, [enabled, reduced, frameRef, cardKey, idle]);

  return { surface, answer };
}
