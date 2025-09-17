import z from 'zod';
import { PLATFORM_ENUM } from '../../../common/schemas/common.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_TOOL_OUTPUT_SCHEMA,
} from '../../../common/schemas/workflow.js';
import { ToolMetadata } from '../../../common/metadata.js';

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

/**
 * Template Discovery Tool Metadata
 */
export const TEMPLATE_DISCOVERY_TOOL: ToolMetadata<
  typeof TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA
> = {
  toolId: 'sfmobile-native-template-discovery',
  name: 'Salesforce Mobile Native Template Discovery',
  title: 'Salesforce Mobile Native Template Discovery Guide',
  description:
    'Guides LLM through template discovery and selection for Salesforce mobile app development',
  inputSchema: TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA,
} as const;
