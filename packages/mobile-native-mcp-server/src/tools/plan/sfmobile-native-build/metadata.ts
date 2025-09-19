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
export const BUILD_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend({
  platform: PLATFORM_ENUM,
  projectPath: PROJECT_PATH_FIELD,
});

export const BUILD_WORKFLOW_RESULT_SCHEMA = z.object({
  buildSuccessful: z.boolean().describe('Whether the build was successful'),
});

export type BuildWorkflowInput = z.infer<typeof BUILD_WORKFLOW_INPUT_SCHEMA>;

/**
 * Build Tool Metadata
 */
export const BUILD_TOOL: WorkflowToolMetadata<
  typeof BUILD_WORKFLOW_INPUT_SCHEMA,
  typeof BUILD_WORKFLOW_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-build',
  title: 'Salesforce Mobile App Build Tool',
  description:
    'Guides LLM through the process of building a Salesforce mobile app with target platform',
  inputSchema: BUILD_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: BUILD_WORKFLOW_RESULT_SCHEMA,
} as const;
