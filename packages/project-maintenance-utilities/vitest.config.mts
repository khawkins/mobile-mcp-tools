import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'tests/**',
        '**/*.config.*',
        'dist/**',
        // Exclude most service implementations - these are thin wrappers around third-party APIs
        // (Node.js fs, child_process, Octokit, @actions/core) and contain no business logic worth testing
        'src/services/implementations/**',
        // But include PackageService which contains business logic we test directly
        '!src/services/implementations/PackageService.ts',
        // Exclude service interfaces - these are TypeScript interface definitions only
        'src/services/interfaces/**',
      ],
      include: ['src/**/*.{js,ts}'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
