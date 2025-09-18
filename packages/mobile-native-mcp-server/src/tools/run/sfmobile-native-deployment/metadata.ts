import z from 'zod';
import { PLATFORM_ENUM, PROJECT_PATH_FIELD } from '../../../common/schemas.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WorkflowToolMetadata,
} from '../../../common/metadata.js';

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

export const DEPLOYMENT_RESULT_SCHEMA = z.object({
  deploymentStatus: z.string().describe('The status of the deployment'),
});

/**
 * Extended input schema for workflow integration
 */
export const DEPLOYMENT_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  DEPLOYMENT_INPUT_SCHEMA.shape
);

export type DeploymentWorkflowInput = z.infer<typeof DEPLOYMENT_WORKFLOW_INPUT_SCHEMA>;

/**
 * Deployment Tool Metadata
 */
export const DEPLOYMENT_TOOL: WorkflowToolMetadata<
  typeof DEPLOYMENT_WORKFLOW_INPUT_SCHEMA,
  typeof DEPLOYMENT_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-deployment',
  name: 'Salesforce Mobile Native Deployment',
  title: 'Salesforce Mobile Native Deployment Guide',
  description:
    'Guides LLM through deploying Salesforce mobile native apps to devices or simulators',
  inputSchema: DEPLOYMENT_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: DEPLOYMENT_RESULT_SCHEMA,
} as const;
