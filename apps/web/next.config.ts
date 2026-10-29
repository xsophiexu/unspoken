import type { NextConfig } from 'next';

import pkg from './package.json' with { type: 'json' };

// GitHub Pages serves the site from /unspoken; local dev and other hosts serve it from the root.
// The base path comes from the environment (NEXT_PUBLIC_BASE_PATH), never from code.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // A static export: plain HTML, CSS and JS that any static host (GitHub Pages) can serve.
  output: 'export',
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  // The shared packages are TypeScript source with no build step.
  transpilePackages: ['@unspoken/core', '@unspoken/content', '@unspoken/design-tokens', '@unspoken/api-contract', '@unspoken/firebase'],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
