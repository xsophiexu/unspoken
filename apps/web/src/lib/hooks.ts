'use client';

import { useLayoutEffect, useMemo, useState, useSyncExternalStore, type RefObject } from 'react';

const noSubscribe = () => () => {};

// False while the server-rendered HTML hydrates, true afterwards. Screens that depend on saved
// choices or a random deal render only once this is true, so hydration never mismatches.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {};
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useMemo(() => subscribeMedia(query), [query]);
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export type Size = { width: number; height: number };

// The element's content box, measured before the first paint and kept up to date as the window
// resizes. `fallback` is only the server render's guess (and a box that has no width yet).
export function useElementSize(ref: RefObject<HTMLElement | null>, fallback: Size): Size {
  const [size, setSize] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (width: number, height: number) =>
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    // Measure once before the first paint, so text fitted to this box never draws at the fallback
    // width (a long word sized for a wider box would wrap off the card until the observer runs).
    const style = getComputedStyle(el);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    if (el.clientWidth > 0) update(el.clientWidth - padX, el.clientHeight - padY);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
