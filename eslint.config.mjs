/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'packages/mobile-web/dist/**',
      'packages/mobile-web/resources/**',
      'packages/mobile-web/coverage/**',
      'packages/github-actions-scripts/dist/**',
      'packages/github-actions-scripts/node_modules/**',
      'packages/github-actions-scripts/coverage/**',
      'packages/evaluation/dist/**',
      'packages/evaluation/node_modules/**',
      'packages/evaluation/coverage/**',
      '**/dist/*',
      '**/*.d.ts',

      // TODO: Clean up linting errors in these files in a future work item
      // Evaluation package files with linting issues
      'packages/evaluation/dataset/mobile-web/qrCodeOnlyScanner/component/qrCodeOnlyScanner.js',
      'packages/evaluation/src/evaluation/evaluator.ts',
      'packages/evaluation/src/evaluation/lwcEvaluatorAgent.ts',
      'packages/evaluation/src/llmclient/llmClient.ts',
      'packages/evaluation/src/mcpclient/mobileWebMcpClient.ts',
      'packages/evaluation/src/utils/lwcUtils.ts',
      'packages/evaluation/tests/mcpclient/mobileWebMcpClient.test.ts',

      // Mobile-web package files with linting issues
      'packages/mobile-web/tests/tools/mobile-offline/offline-analysis/tool.test.ts',
      'packages/mobile-web/tests/utils/tool-test-helper.ts',
    ],
  },
  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // TypeScript and prettier configuration
  {
    files: [
      'packages/mobile-web/src/**/*.ts',
      'packages/github-actions-scripts/src/**/*.ts',
      'packages/evaluation/src/**/*.ts',
    ],
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
);
