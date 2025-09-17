import z from 'zod';
import { PLATFORM_ENUM, PROJECT_PATH_FIELD } from '../../../common/schemas/common.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_TOOL_OUTPUT_SCHEMA,
} from '../../../common/schemas/workflow.js';
import { ToolMetadata } from '../../../common/metadata.js';

/**
 * Deployment Tool Input Schema
 */
export const DEPLOYMENT_INPUT_SCHEMA = z.object({
  platform: PLATFORM_ENUM,
  projectPath: PROJECT_PATH_FIELD,
  buildType: z.enum(['debug', 'release']).default('debug').describe('Build type for deployment'),
  targetDevice: z.string().optional().describe('Target device identifier (optional)'),
});

export type DeploymentInput = z.infer<typeof DEPLOYMENT_INPUT_SCHEMA>;

/**
 * Extended input schema for workflow integration
 */
export const DEPLOYMENT_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  DEPLOYMENT_INPUT_SCHEMA.shape
);

/**
 * Deployment Tool Output Schema
 */
export const DEPLOYMENT_OUTPUT_SCHEMA = MCP_TOOL_OUTPUT_SCHEMA.extend({
  // Additional deployment-specific output fields can be added here
});

export type DeploymentOutput = z.infer<typeof DEPLOYMENT_OUTPUT_SCHEMA>;

/**
 * Deployment Tool Metadata
 */
export const DEPLOYMENT_TOOL: ToolMetadata<typeof DEPLOYMENT_WORKFLOW_INPUT_SCHEMA> = {
  toolId: 'sfmobile-native-deployment',
  name: 'Salesforce Mobile Native Deployment',
  title: 'Salesforce Mobile Native Deployment Guide',
  description:
    'Guides LLM through deploying Salesforce mobile native apps to devices or simulators',
  inputSchema: DEPLOYMENT_WORKFLOW_INPUT_SCHEMA,
} as const;
