/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { z } from 'zod';

/**
 * Extension for Zod schemas to add common descriptive patterns
 *
 * This module extends Zod's functionality with custom methods that
 * add standardized descriptions to schema fields.
 */

declare module 'zod' {
  interface ZodType {
    /**
     * Adds a standard "do not make assumptions" instruction to the schema description
     *
     * @param customDescription Optional additional description to prepend
     * @returns The schema with updated description
     */
    notAssumable(customDescription?: string): this;
  }
}

/**
 * Implementation of the notAssumable extension method
 */
z.ZodType.prototype.notAssumable = function (customDescription?: string) {
  const baseDescription = this.description || '';
  const notAssumableText = 'You must NOT make any assumptions about this value.';

  let newDescription: string;
  if (customDescription) {
    newDescription = `${customDescription} ${notAssumableText}`;
  } else if (baseDescription) {
    newDescription = `${baseDescription} ${notAssumableText}`;
  } else {
    newDescription = notAssumableText;
  }

  return this.describe(newDescription);
};

export {};
