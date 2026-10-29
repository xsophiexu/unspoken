import { defineConfig } from 'vitest/config';

// The firestore.rules tests, run inside `firebase emulators:exec` by `pnpm test:rules`.
export default defineConfig({
  test: { include: ['test/emulator/**/*.test.ts'], testTimeout: 20_000, fileParallelism: false },
});
