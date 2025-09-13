/**
 * Build Tool Schemas
 *
 * Input and output schemas for the build tool.
 */

import { z } from 'zod';
import { PLATFORM_ENUM, PROJECT_PATH_FIELD } from '../common.js';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA, MCP_TOOL_OUTPUT_SCHEMA } from '../workflow.js';

/**
 * Build Tool Input Schema
 */
export const BUILD_INPUT_SCHEMA = z.object({
  platform: PLATFORM_ENUM,
  projectPath: PROJECT_PATH_FIELD.describe('Path to the project'),
});

export type BuildInput = z.infer<typeof BUILD_INPUT_SCHEMA>;

/**
 * Extended input schema for workflow integration
 */
export const BUILD_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  BUILD_INPUT_SCHEMA.shape
);

/**
 * Build Tool Output Schema
 */
export const BUILD_OUTPUT_SCHEMA = MCP_TOOL_OUTPUT_SCHEMA.extend({
  // Additional build-specific output fields can be added here
});

export type BuildOutput = z.infer<typeof BUILD_OUTPUT_SCHEMA>;
