import { defineConfig } from 'vitest/config';

// Unit tests only. The rules tests in test/emulator need the Firestore and Auth emulators; run
// them with `pnpm test:rules`.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'], exclude: ['test/emulator/**'] },
});
