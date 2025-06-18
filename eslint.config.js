/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
    {
        ignores: [
            'packages/mobile-web/dist/**',
            'packages/mobile-web/resources/**',
            'packages/mobile-web/coverage/**',
        ]
    },
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: ['packages/mobile-web/src/**/*.ts']
    }))
];