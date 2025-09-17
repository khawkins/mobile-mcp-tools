import z from 'zod';
import { PLATFORM_ENUM, PROJECT_PATH_FIELD } from '../../../common/schemas/common.js';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA } from '../../../common/schemas/workflow.js';
import { MCP_TOOL_OUTPUT_SCHEMA } from '../../../common/schemas/workflow.js';
import { ToolMetadata } from '../../../common/metadata.js';

/**
 * Build Tool Input Schema
 */
export const BUILD_INPUT_SCHEMA = z.object({
  platform: PLATFORM_ENUM,
  projectPath: PROJECT_PATH_FIELD,
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

/**
 * Build Tool Metadata
 */
export const BUILD_TOOL: ToolMetadata<typeof BUILD_WORKFLOW_INPUT_SCHEMA> = {
  toolId: 'sfmobile-native-build',
  name: 'Salesforce Mobile App Build Tool',
  title: 'Salesforce Mobile app build guide',
  description:
    'Guides LLM through the process of building a Salesforce mobile app with target platform',
  inputSchema: BUILD_WORKFLOW_INPUT_SCHEMA,
} as const;
