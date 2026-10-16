// Shared lint config for the TypeScript packages in packages/* and any workspace without its own
// eslint.config.js (ESLint uses the nearest config above the folder it runs in). Apps with their own
// framework rules (apps/mobile, apps/web) keep a config next to their package.json.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['**/dist/**', '**/.expo/**', '**/.next/**', '**/web-build/**', '**/coverage/**'],
  },
  {
    // Modules the import plugin doesn't read: Expo's React Native entry, and PGlite (services/api tests),
    // whose bundled build overflows the plugin's parser.
    settings: { 'import/ignore': ['node_modules[\\\\/]+@?react-native', 'node_modules[\\\\/]+@electric-sql[\\\\/]+pglite'] },
  },
]);
