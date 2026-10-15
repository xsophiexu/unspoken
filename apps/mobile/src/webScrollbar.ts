import { Platform } from 'react-native';

// Browsers draw their own grey scrollbars. On web, swap them for a slim, rounded bar in the
// current theme's ink color with a clear track. Native platforms keep their own indicators.
const CSS = `
@supports not selector(::-webkit-scrollbar) {
  * { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) transparent; }
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--scroll-thumb-hover); }
::-webkit-scrollbar-corner { background: transparent; }
::-webkit-scrollbar-button { display: none; height: 0; width: 0; }
`;

export function styleWebScrollbars(ink: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!document.getElementById('unspoken-scrollbars')) {
    const el = document.createElement('style');
    el.id = 'unspoken-scrollbars';
    el.textContent = CSS;
    document.head.appendChild(el);
  }
  // Hex alpha: about 30% at rest, 50% on hover.
  document.documentElement.style.setProperty('--scroll-thumb', `${ink}4D`);
  document.documentElement.style.setProperty('--scroll-thumb-hover', `${ink}80`);
}
