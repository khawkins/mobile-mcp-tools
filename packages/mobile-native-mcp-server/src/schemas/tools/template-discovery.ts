/**
 * Template Discovery Tool Schemas
 *
 * Input and output schemas for the template discovery tool.
 */

import { z } from 'zod';
import { PLATFORM_ENUM } from '../common.js';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA, MCP_TOOL_OUTPUT_SCHEMA } from '../workflow.js';

/**
 * Template Discovery Tool Input Schema
 */
export const TEMPLATE_DISCOVERY_INPUT_SCHEMA = z.object({
  platform: PLATFORM_ENUM,
});

export type TemplateDiscoveryInput = z.infer<typeof TEMPLATE_DISCOVERY_INPUT_SCHEMA>;

/**
 * Extended input schema for workflow integration
 */
export const TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  TEMPLATE_DISCOVERY_INPUT_SCHEMA.shape
);

/**
 * Template Discovery Tool Output Schema
 */
export const TEMPLATE_DISCOVERY_OUTPUT_SCHEMA = MCP_TOOL_OUTPUT_SCHEMA;

export type TemplateDiscoveryOutput = z.infer<typeof TEMPLATE_DISCOVERY_OUTPUT_SCHEMA>;
