import z from 'zod';
import { PLATFORM_ENUM, PROJECT_PATH_FIELD } from '../../../common/schemas.js';
import {
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  WorkflowToolMetadata,
} from '../../../common/metadata.js';

/**
 * Build Tool Input Schema
 */
export const BUILD_INPUT_SCHEMA = z.object({
  platform: PLATFORM_ENUM,
  projectPath: PROJECT_PATH_FIELD,
});

export type BuildInput = z.infer<typeof BUILD_INPUT_SCHEMA>;

export const BUILD_RESULT_SCHEMA = z.object({
  buildSuccessful: z.boolean().describe('Whether the build was successful'),
});

/**
 * Extended input schema for workflow integration
 */
export const BUILD_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  BUILD_INPUT_SCHEMA.shape
);

export type BuildWorkflowInput = z.infer<typeof BUILD_WORKFLOW_INPUT_SCHEMA>;

/**
 * Build Tool Metadata
 */
export const BUILD_TOOL: WorkflowToolMetadata<
  typeof BUILD_WORKFLOW_INPUT_SCHEMA,
  typeof BUILD_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-build',
  name: 'Salesforce Mobile App Build Tool',
  title: 'Salesforce Mobile app build guide',
  description:
    'Guides LLM through the process of building a Salesforce mobile app with target platform',
  inputSchema: BUILD_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: BUILD_RESULT_SCHEMA,
} as const;
