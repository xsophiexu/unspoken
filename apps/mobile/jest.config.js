// Interaction tests for the screens: they render the real Expo Router app (src/app) and mock only
// the boundaries (device storage here, network and timers in the tests).
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.tsx'],
  // The first render transforms the whole app; under a parallel workspace run that can pass 5s.
  testTimeout: 30_000,
};
