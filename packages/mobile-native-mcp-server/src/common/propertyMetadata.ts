/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';

/**
 * Metadata definition for a property that can be extracted from user input.
 *
 * This type provides a generalized structure for defining properties that need to be
 * collected from users, either through extraction from natural language or explicit prompting.
 *
 * @template T - The Zod schema type for this property
 *
 * @property zodType - Zod schema used for validation and type inference
 * @property description - Detailed description used by LLMs to identify the property in user input
 * @property friendlyName - Human-readable name for display and prompting
 *
 * @example
 * const platformProperty: PropertyMetadata<typeof PLATFORM_ENUM> = {
 *   zodType: PLATFORM_ENUM,
 *   description: 'Target mobile platform for the mobile app (iOS or Android)',
 *   friendlyName: 'mobile platform',
 * };
 */
export interface PropertyMetadata<T extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Zod schema for validation and type inference */
  readonly zodType: T;

  /** Detailed description for LLM-based extraction */
  readonly description: string;

  /** Human-readable name for display */
  readonly friendlyName: string;
}

/**
 * Collection of properties with their metadata.
 * Used to define a set of related properties that can be extracted together.
 *
 * @example
 * const myProperties: PropertyMetadataCollection = {
 *   platform: {
 *     zodType: z.enum(['iOS', 'Android']),
 *     description: 'Target mobile platform',
 *     friendlyName: 'platform',
 *   },
 *   projectName: {
 *     zodType: z.string(),
 *     description: 'Name of the project',
 *     friendlyName: 'project name',
 *   },
 * };
 */
export type PropertyMetadataCollection = Record<string, PropertyMetadata>;

/**
 * Extracts the inferred TypeScript types from a PropertyMetadataCollection.
 * Useful for creating type-safe objects that match the property definitions.
 *
 * @example
 * type MyProps = InferPropertyTypes<typeof myProperties>;
 * // Results in: { platform: 'iOS' | 'Android', projectName: string }
 */
export type InferPropertyTypes<T extends PropertyMetadataCollection> = {
  [K in keyof T]: z.infer<T[K]['zodType']>;
};
