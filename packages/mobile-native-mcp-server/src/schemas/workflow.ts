/**
 * Workflow-Specific Schemas
 *
 * Contains schemas and types specifically related to workflow orchestration,
 * state management, and the orchestrator tool.
 */

import { z } from 'zod';
import dedent from 'dedent';
import { ORCHESTRATOR_TOOL } from '../registry/toolRegistry.js';

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
 * @template TWorkflowInput - The full workflow input schema shape (includes workflowStateData)
 * @template TBusinessInput - The business logic input data type (excludes workflowStateData)
 */
export interface MCPToolInvocationData<
  TWorkflowInput extends z.ZodRawShape = z.ZodRawShape,
  TBusinessInput = Record<string, unknown>,
> {
  /** Metadata about the tool to invoke - uses full workflow schema for orchestration prompt */
  llmMetadata: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<TWorkflowInput>;
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

/**
 * Post-invocation instructions template for workflow round-tripping
 * This template is used by all workflow tools to guide the LLM back to the orchestrator
 */
export const POST_INVOCATION_INSTRUCTIONS_TEMPLATE = dedent`
  # Post-Tool-Invocation Instructions

  After this prompt has been processed, you MUST initiate the following actions to proceed with the in-progress workflow:

  - Invoke the \`${ORCHESTRATOR_TOOL.toolId}\` tool, with the following input schema:

  \`\`\`json
  {ORCHESTRATOR_INPUT_SCHEMA_JSON}
  \`\`\`

  - The value for the \`${WORKFLOW_PROPERTY_NAMES.userInput}\` parameter should be {toolOutputDescription}
  - The \`${WORKFLOW_PROPERTY_NAMES.workflowStateData}\` parameter should be passed with the following object value:

  \`\`\`json
  {WORKFLOW_STATE_DATA_JSON}
  \`\`\`

  This represents opaque workflow state data that should be round-tripped back to the \`${ORCHESTRATOR_TOOL.toolId}\`
  MCP server tool orchestrator at the completion of the next MCP server tool invocation, without modification. These
  instructions will be further specified by the next MCP server tool invocation.

  - The MCP server tool you invoke will respond with its output, along with further instructions for continuing the workflow.
`;
