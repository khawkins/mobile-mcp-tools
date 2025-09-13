/**
 * Common Schema Components
 *
 * Shared field definitions, validators, and schema components used across multiple tools.
 * This eliminates duplication and ensures consistency in field validation.
 */

import { z } from 'zod';

/**
 * Platform enum used across all mobile tools
 */
export const PLATFORM_ENUM = z.enum(['iOS', 'Android']).describe('Target mobile platform');

/**
 * Project path field used in multiple tools
 */
export const PROJECT_PATH_FIELD = z.string().describe('Path to the mobile project directory');
