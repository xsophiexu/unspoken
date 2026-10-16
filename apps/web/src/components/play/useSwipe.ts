'use client';

import { motion } from '@unspoken/design-tokens';
import { useCallback, useEffect, useMemo, useRef, type HTMLAttributes, type RefObject } from 'react';

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
};

type Drag = { id: number; x: number; y: number; dx: number; active: boolean };

const { swipe, hint } = motion;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function setDrag(el: HTMLElement, dx: number, phase: 'drag' | 'settle' | 'fly' | null) {
  el.style.setProperty('--drag-x', `${dx}px`);
  el.style.setProperty('--drag-rot', `${clamp(dx / swipe.tiltAtPx, -1, 1) * swipe.maxTiltDeg}deg`);
  el.style.setProperty('--drag-p', String(clamp(dx / swipe.thresholdPx, -1, 1)));
  if (phase) el.dataset.drag = phase;
  else delete el.dataset.drag;
  if (dx < 0) el.dataset.dragDir = 'skip';
  else if (dx > 0) el.dataset.dragDir = 'correct';
  else delete el.dataset.dragDir;
}

// Swipe right for Correct and left for Skip. The card follows the pointer; past the threshold it
// flies off and the answer is sent, otherwise it settles back. Buttons and keys use answer(), which
// plays the same fly-off. With reduced motion, answers apply at once.
export function useSwipe({ frameRef, can, onAnswer, cardKey }: SwipeOptions) {
  const reduced = useReducedMotion();
  const drag = useRef<Drag | null>(null);
  const flying = useRef(false);
  const timers = useRef<number[]>([]);
  const latest = useRef({ can, onAnswer });
  useEffect(() => {
    latest.current = { can, onAnswer };
  });

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

  const enabled = can.correct || can.skip;
  const surface = useMemo((): HTMLAttributes<HTMLDivElement> => {
    if (!enabled) return {};
    return {
      onPointerDown: (e) => {
        if (flying.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
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
  }, [enabled, frameRef, answer, settle]);

  // The card nudges right to show it swipes: soon after the round starts, then after a long idle.
  const firstNudge = useRef(true);
  useEffect(() => {
    const el = frameRef.current;
    if (!enabled || reduced || !el || cardKey === null) return;
    const wait = firstNudge.current ? hint.firstDelayMs : hint.idleMs;
    const id = window.setTimeout(() => {
      firstNudge.current = false;
      const total = hint.outMs * 2 + hint.holdMs;
      const out = `translateX(${hint.nudgePx}px)`;
      el.querySelectorAll<HTMLElement>('[data-swipe]').forEach((part) =>
        part.animate?.(
          [
            { transform: 'translateX(0px)' },
            { transform: out, offset: hint.outMs / total },
            { transform: out, offset: (hint.outMs + hint.holdMs) / total },
            { transform: 'translateX(0px)' },
          ],
          { duration: total, easing: 'ease-in-out' },
        ),
      );
    }, wait);
    return () => window.clearTimeout(id);
  }, [enabled, reduced, frameRef, cardKey]);

  return { surface, answer };
}
