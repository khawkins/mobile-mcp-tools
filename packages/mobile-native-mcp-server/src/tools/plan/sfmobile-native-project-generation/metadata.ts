import z from 'zod';
import { PLATFORM_ENUM } from '../../../common/schemas/common.js';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA } from '../../../common/schemas/workflow.js';
import { MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA } from '../../../common/schemas/workflow.js';
import { WorkflowToolMetadata } from '../../../common/metadata.js';

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

export const PROJECT_GENERATION_RESULT_SCHEMA = z.object({
  projectPath: z.string().describe('The path to the generated project'),
});

/**
 * Extended input schema for workflow integration
 */
export const PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  PROJECT_GENERATION_INPUT_SCHEMA.shape
);

export type ProjectGenerationWorkflowInput = z.infer<
  typeof PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA
>;

/**
 * Project Generation Tool Metadata
 */
export const PROJECT_GENERATION_TOOL: WorkflowToolMetadata<
  typeof PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA,
  typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  typeof PROJECT_GENERATION_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-project-generation',
  name: 'Salesforce Mobile Native Project Generation',
  title: 'Salesforce Mobile Native Project Generation Guide',
  description:
    'Provides LLM instructions for generating a mobile app project from a selected template with OAuth configuration',
  inputSchema: PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: PROJECT_GENERATION_RESULT_SCHEMA,
} as const;
