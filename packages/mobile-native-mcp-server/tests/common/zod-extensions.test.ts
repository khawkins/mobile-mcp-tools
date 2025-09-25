/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import '../../src/common/zod-extensions.js';

describe('Zod Extensions', () => {
  describe('notAssumable', () => {
    it('should add "You must NOT make any assumptions about this value." to the description', () => {
      const schema = z.string().notAssumable();
      expect(schema.description).toBe('You must NOT make any assumptions about this value.');
    });

    it('should append to an existing description', () => {
      const schema = z.string().describe('Test description').notAssumable();
      expect(schema.description).toBe(
        'Test description You must NOT make any assumptions about this value.'
      );
    });

    it('should prepend a custom description', () => {
      const schema = z.string().notAssumable('Custom description.');
      expect(schema.description).toBe(
        'Custom description. You must NOT make any assumptions about this value.'
      );
    });

    it('should work with other Zod types', () => {
      const schema = z.number().notAssumable();
      expect(schema.description).toBe('You must NOT make any assumptions about this value.');
    });

    it('should work with enum types', () => {
      const schema = z.enum(['a', 'b']).notAssumable();
      expect(schema.description).toBe('You must NOT make any assumptions about this value.');
    });

    it('should work with optional types', () => {
      const schema = z.string().optional().notAssumable();
      expect(schema.description).toBe('You must NOT make any assumptions about this value.');
    });
  });
});
