import z from 'zod';
import { PLATFORM_ENUM } from '../../../common/schemas/common.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
} from '../../../common/schemas/workflow.js';
import { WorkflowToolMetadata } from '../../../common/metadata.js';

/**
 * Template Discovery Tool Input Schema
 */
export const TEMPLATE_DISCOVERY_INPUT_SCHEMA = z.object({
  platform: PLATFORM_ENUM,
});

export type TemplateDiscoveryInput = z.infer<typeof TEMPLATE_DISCOVERY_INPUT_SCHEMA>;

export const TEMPLATE_DISCOVERY_RESULT_SCHEMA = z.object({
  selectedTemplate: z.string().describe('The template ID selected from template discovery'),
  projectName: z.string().describe('Name for the mobile app project'),
  packageName: z.string().describe('Package name for the mobile app (e.g., com.company.appname)'),
  organization: z.string().describe('Organization name for the mobile app project'),
  connectedAppClientId: z.string().describe('Connected App Client ID for OAuth configuration'),
  connectedAppCallbackUri: z
    .string()
    .describe('Connected App Callback URI for OAuth configuration'),
  loginHost: z.string().describe('Login host for the mobile app project'),
});

/**
 * Extended input schema for workflow integration
 */
export const TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  TEMPLATE_DISCOVERY_INPUT_SCHEMA.shape
);

export type TemplateDiscoveryWorkflowInput = z.infer<
  typeof TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA
>;

/**
 * Template Discovery Tool Metadata
 */
export const TEMPLATE_DISCOVERY_TOOL: WorkflowToolMetadata<
  typeof TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA,
  typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  typeof TEMPLATE_DISCOVERY_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-template-discovery',
  name: 'Salesforce Mobile Native Template Discovery',
  title: 'Salesforce Mobile Native Template Discovery Guide',
  description:
    'Guides LLM through template discovery and selection for Salesforce mobile app development',
  inputSchema: TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: TEMPLATE_DISCOVERY_RESULT_SCHEMA,
} as const;
