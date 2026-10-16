import { radius, space } from '@unspoken/design-tokens';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { appConfig } from './config';

// Browser-only touches: themed scrollbars and Google Analytics when a measurement id is configured.
// Native platforms do nothing.

const web = Platform.OS === 'web' && typeof document !== 'undefined';

const SCROLLBAR_CSS = `
@supports not selector(::-webkit-scrollbar) {
  * { scrollbar-width: thin; scrollbar-color: var(--un-scroll-thumb) transparent; }
}
::-webkit-scrollbar { width: ${space[1.5]}px; height: ${space[1.5]}px; }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--un-scroll-thumb); border-radius: ${radius.pill}px; }
::-webkit-scrollbar-thumb:hover { background: var(--un-scroll-thumb-hover); }
::-webkit-scrollbar-button { display: none; height: 0; width: 0; }
`;

function addOnce(id: string, make: () => HTMLElement) {
  if (document.getElementById(id)) return;
  const el = make();
  el.id = id;
  document.head.appendChild(el);
}

// Slim scrollbars in the theme's outline color (muted on hover) instead of the browser's grey.
export function useWebScrollbars(thumb: string, hover: string) {
  useEffect(() => {
    if (!web) return;
    addOnce('unspoken-scrollbars', () => Object.assign(document.createElement('style'), { textContent: SCROLLBAR_CSS }));
    document.documentElement.style.setProperty('--un-scroll-thumb', thumb);
    document.documentElement.style.setProperty('--un-scroll-thumb-hover', hover);
  }, [thumb, hover]);
}

type Gtag = { dataLayer?: unknown[] };

// Loads gtag.js for EXPO_PUBLIC_GA_MEASUREMENT_ID, once.
export function useAnalytics() {
  useEffect(() => {
    const id = appConfig().gaMeasurementId;
    if (!web || !id) return;
    addOnce('unspoken-gtag', () => Object.assign(document.createElement('script'), { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}` }));
    const w = window as unknown as Gtag;
    w.dataLayer = w.dataLayer ?? [];
    // gtag() queues its arguments object, as Google's snippet does.
    function gtag(..._args: unknown[]) {
      w.dataLayer?.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', id);
  }, []);
}
