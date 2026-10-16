// The Railway project for the API, as code: a Postgres database and this service, built from
// services/api/Dockerfile. The README's dashboard steps make the same setup by hand. To apply it with
// the Railway CLI, from services/api: `railway login`, `railway init` (or `railway link`), then
// `railway config plan` and `railway config apply`. Railway no longer reads railway.json for new
// services; this file replaces it.
import { defineRailway, github, postgres, project, service } from 'railway/iac';

export default defineRailway(() => {
  // Named as the dashboard names a new database, so ${{Postgres.DATABASE_URL}} works either way.
  const db = postgres('Postgres');

  const api = service('api', {
    // The whole repository, not services/api: the image bundles packages/core, packages/content and
    // packages/api-contract, and installs from the root lockfile.
    source: github('xsophiexu/unspoken', { branch: 'main' }),
    build: {
      builder: 'DOCKERFILE',
      dockerfilePath: 'services/api/Dockerfile',
      // Redeploy only for changes to the service, the packages it bundles, or its dependencies.
      watchPatterns: ['/services/api/**', '/packages/core/**', '/packages/content/**', '/packages/api-contract/**', '/package.json', '/pnpm-lock.yaml'],
    },
    // The image's own command, named here so the deploy settings show it. It reads PORT, which Railway sets.
    start: 'node --enable-source-maps dist/main.js',
    healthcheck: '/health',
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      // Browser origins of the web apps, comma-separated. Native apps need no entry.
      CORS_ORIGINS: 'https://xsophiexu.github.io',
    },
  });

  return project('unspoken', { resources: [db, api] });
});
