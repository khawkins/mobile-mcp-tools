import z from 'zod';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA } from '../../../common/schemas/workflow.js';
import { ToolMetadata } from '../../../common/metadata.js';

/**
 * Orchestrator input schema - simplified to single userInput parameter
 */
export const ORCHESTRATOR_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend({
  userInput: z
    .unknown()
    .optional()
    .describe(
      'User input - can be any data structure from initial request or previously executed MCP tool'
    ),
});

export type OrchestratorInput = z.infer<typeof ORCHESTRATOR_INPUT_SCHEMA>;

/**
 * Orchestrator output schema - natural language orchestration prompt with completion status
 */
export const ORCHESTRATOR_OUTPUT_SCHEMA = z.object({
  orchestrationInstructionsPrompt: z
    .string()
    .describe('The prompt describing the next workflow action for the LLM to execute.'),
  isComplete: z
    .boolean()
    .describe('True if the workflow has finished, false if the workflow has not finished.'),
});

export type OrchestratorOutput = z.infer<typeof ORCHESTRATOR_OUTPUT_SCHEMA>;

/**
 * Orchestrator Tool Metadata
 */
export const ORCHESTRATOR_TOOL: ToolMetadata<typeof ORCHESTRATOR_INPUT_SCHEMA> = {
  toolId: 'sfmobile-native-project-manager',
  name: 'Salesforce Mobile Native Project Manager',
  title: 'Salesforce Mobile Native Project Manager Orchestrator',
  description: 'Orchestrates the end-to-end workflow for generating Salesforce native mobile apps.',
  inputSchema: ORCHESTRATOR_INPUT_SCHEMA,
} as const;
