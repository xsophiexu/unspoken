import { en } from '@unspoken/content';
import type { MetadataRoute } from 'next';

import { config } from '@/lib/config';

export const dynamic = 'force-static';

// The installable web app: name and the interim app icon (Clay, lightest), shared with the Android app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: en.app.name,
    short_name: en.app.name,
    description: en.app.tagline,
    start_url: `${config.basePath}/`,
    display: 'standalone',
    icons: [
      { src: `${config.basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${config.basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
  };
}
