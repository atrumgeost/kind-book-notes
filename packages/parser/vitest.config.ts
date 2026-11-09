import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The parser relies on the standard DOMParser; happy-dom provides it in tests.
    environment: 'happy-dom',
  },
});
