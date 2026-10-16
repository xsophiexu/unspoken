import { en, type CopyCatalog } from './en';

export { en, roundCopy, type CopyCatalog, type SpotlightStep, type SpotlightTarget } from './en';

// Catalogs by locale. Add a locale by copying en.ts; the CopyCatalog type keeps every key in step.
export const catalogs: Readonly<Record<string, CopyCatalog>> = { en };

export const DEFAULT_LOCALE = 'en';

// The catalog for a locale tag such as "en-GB", falling back to the language and then to English.
export function copyFor(locale: string | undefined): CopyCatalog {
  if (!locale) return en;
  const exact = catalogs[locale];
  if (exact) return exact;
  const language = locale.split(/[-_]/)[0]?.toLowerCase() ?? '';
  return catalogs[language] ?? en;
}
