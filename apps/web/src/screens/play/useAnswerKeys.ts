'use client';

import { useEffect } from 'react';

import type { SwipeAnswer } from '@/components/play/useSwipe';

// Arrow keys answer like a swipe: right for Correct, left for Skip (or Got it and Missed).
export function useAnswerKeys(enabled: boolean, answer: (kind: SwipeAnswer) => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const kind = event.key === 'ArrowRight' ? 'correct' : event.key === 'ArrowLeft' ? 'skip' : null;
      if (!kind) return;
      event.preventDefault();
      answer(kind);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, answer]);
}
