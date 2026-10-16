import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';

import { en } from '@unspoken/content';
import { DEFAULT_THEME } from '@unspoken/design-tokens';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { config } from '@/lib/config';
import { bootScript, themeAttributes } from '@/theme/boot';

import { Analytics } from './analytics';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: en.app.name,
  description: en.app.tagline,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The boot script sets the saved theme's attributes before paint, so React keeps what it finds.
    <html lang="en" {...themeAttributes(DEFAULT_THEME)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript() }} />
        <link rel="stylesheet" href={`${config.basePath}/theme.css`} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics measurementId={config.gaMeasurementId} />
      </body>
    </html>
  );
}
