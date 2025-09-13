/**
 * Project Generation Tool Schemas
 *
 * Input and output schemas for the project generation tool.
 */

import { z } from 'zod';
import { PLATFORM_ENUM } from '../common.js';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA, MCP_TOOL_OUTPUT_SCHEMA } from '../workflow.js';

/**
 * Project Generation Tool Input Schema
 */
export const PROJECT_GENERATION_INPUT_SCHEMA = z.object({
  selectedTemplate: z.string().describe('The template ID selected from template discovery'),
  projectName: z.string().describe('Name for the mobile app project'),
  platform: PLATFORM_ENUM,
  packageName: z.string().describe('Package name for the mobile app (e.g., com.company.appname)'),
  organization: z.string().describe('Organization name for the mobile app project'),
  connectedAppClientId: z.string().describe('Connected App Client ID for OAuth configuration'),
  connectedAppCallbackUri: z
    .string()
    .describe('Connected App Callback URI for OAuth configuration'),
  loginHost: z
    .string()
    .optional()
    .describe('Optional Salesforce login host URL (e.g., https://test.salesforce.com for sandbox)'),
});

export type ProjectGenerationInput = z.infer<typeof PROJECT_GENERATION_INPUT_SCHEMA>;

/**
 * Extended input schema for workflow integration
 */
export const PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  PROJECT_GENERATION_INPUT_SCHEMA.shape
);

/**
 * Project Generation Tool Output Schema
 */
export const PROJECT_GENERATION_OUTPUT_SCHEMA = MCP_TOOL_OUTPUT_SCHEMA;

export type ProjectGenerationOutput = z.infer<typeof PROJECT_GENERATION_OUTPUT_SCHEMA>;
