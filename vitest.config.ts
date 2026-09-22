/**
 * The runner for `__tests__/`.
 *
 * These tests existed before this file did and nothing ran them: there was no
 * `test` script and vitest was not a dependency, so ten suites sat in the
 * repository as documentation. The `@/` alias is why they could not simply be
 * run either -- it is a tsconfig path Next resolves and a bare runner does not.
 *
 * No `defineConfig` import: that comes from vitest itself, and this file has to
 * load before vitest is necessarily installed locally.
 */
import { fileURLToPath } from 'node:url';

export default {
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    include: ['__tests__/**/*.test.ts'],
    // The suites call describe/it/expect without importing them, which is how
    // they were written; without this every file fails at its first line.
    globals: true,
    environment: 'node',
  },
};
