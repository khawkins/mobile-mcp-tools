/**
 * Workflow-Specific Schemas
 *
 * Contains schemas and types specifically related to workflow orchestration,
 * state management, and the orchestrator tool.
 */

import { z } from 'zod';

/**
 * Workflow state data schema for round-tripping session identity
 * This lightweight object maintains workflow session continuity across stateless MCP tool invocations
 */
export const WORKFLOW_STATE_DATA_SCHEMA = z.object({
  thread_id: z.string().describe('Unique identifier for the workflow session'),
  expectedInputSchema: z
    .instanceof(z.ZodType)
    .optional()
    .describe("Expected input schema for the next tool's output"),
});

export type WorkflowStateData = z.infer<typeof WORKFLOW_STATE_DATA_SCHEMA>;

/**
 * Workflow property names - single source of truth for property naming
 */
export const WORKFLOW_PROPERTY_NAMES = {
  workflowStateData: 'workflowStateData',
  userInput: 'userInput',
} as const;

/**
 * Base input schema for workflow-aware tools
 * All tools participating in workflow orchestration should extend this schema
 */
export const WORKFLOW_TOOL_BASE_INPUT_SCHEMA = z.object({
  [WORKFLOW_PROPERTY_NAMES.workflowStateData]: WORKFLOW_STATE_DATA_SCHEMA.optional().describe(
    'Workflow session state for continuation (auto-generated if not provided)'
  ),
});

/**
 * MCP tool invocation data structure used in LangGraph interrupts
 * Contains all information needed for the orchestrator to create tool invocation instructions
 *
 * @template TWorkflowInputSchema - The full workflow input schema (includes workflowStateData)
 * @template TBusinessInput - The business logic input data type (excludes workflowStateData)
 */
export interface MCPToolInvocationData<
  TWorkflowInputSchema extends z.ZodObject<z.ZodRawShape>,
  TBusinessInput = Record<string, unknown>,
> {
  /** Metadata about the tool to invoke - uses full workflow schema for orchestration prompt */
  llmMetadata: {
    name: string;
    description: string;
    inputSchema: TWorkflowInputSchema;
  };
  /** Input parameters for the tool invocation - typed to business logic schema only */
  input: TBusinessInput;
  /** Whether this represents workflow completion */
  isComplete: boolean;
}

/**
 * Standard output schema for all workflow MCP tools
 */
export const MCP_TOOL_OUTPUT_SCHEMA = z.object({
  promptForLLM: z
    .string()
    .describe('Complete prompt with instructions and post-processing guidance'),
});
