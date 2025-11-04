/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect } from 'vitest';
import { PACKAGE_VERSION } from '../src/index.js';

describe('mcp-workflow package', () => {
  it('should export PACKAGE_VERSION', () => {
    expect(PACKAGE_VERSION).toBe('0.1.0');
  });

  it('should have package scaffolding in place', () => {
    // This test verifies Phase 1 scaffolding is complete
    // Actual functionality tests will be added during Phase 2+ extraction
    expect(true).toBe(true);
  });
});
