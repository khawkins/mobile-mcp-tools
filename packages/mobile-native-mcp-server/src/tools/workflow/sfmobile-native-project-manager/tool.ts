import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { BaseCheckpointSaver, Command } from '@langchain/langgraph';
import { getWorkflowStateDatabasePath } from '../../../utils/wellKnownDirectory.js';
import { ORCHESTRATOR_TOOL, OrchestratorInput, OrchestratorOutput } from './metadata.js';
import { Logger, createWorkflowLogger } from '../../../logging/logger.js';
import { AbstractTool } from '../../base/abstractTool.js';
import {
  MCPToolInvocationData,
  WORKFLOW_PROPERTY_NAMES,
  WorkflowStateData,
} from '../../../common/metadata.js';
import { mobileNativeWorkflow } from '../../../workflow/graph.js';
import { State } from '../../../workflow/metadata.js';

/**
 * Generate unique thread ID for workflow sessions
 */
function generateUniqueThreadId(): string {
  return `mobile-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create and configure workflow checkpointer for state persistence
 *
 * @param useMemoryForTesting - If true, uses SQLite :memory: database for test isolation
 *
 */
function createCheckpointer(useMemoryForTesting = false): BaseCheckpointSaver {
  if (useMemoryForTesting) {
    // Use SQLite in-memory database for testing - no filesystem persistence
    return SqliteSaver.fromConnString(':memory:');
  }

  // Create SQLite checkpointer in .magen directory
  const dbPath = getWorkflowStateDatabasePath();
  return SqliteSaver.fromConnString(dbPath);
}

/**
 * Mobile Native Orchestrator Tool
 *
 * Implements the sfmobile-native-project-manager tool that orchestrates the complete
 * mobile app generation workflow using LangGraph.js for deterministic state management
 * and human-in-the-loop patterns for agentic task execution.
 */
export class MobileNativeOrchestrator extends AbstractTool<typeof ORCHESTRATOR_TOOL> {
  private readonly useMemoryForTesting: boolean;

  constructor(server: McpServer, logger?: Logger, useMemoryForTesting = false) {
    // Use provided logger (for testing) or create workflow logger (for production)
    const effectiveLogger = logger || createWorkflowLogger('MobileNativeOrchestrator');
    super(server, ORCHESTRATOR_TOOL, 'MobileNativeOrchestrator', effectiveLogger);
    this.useMemoryForTesting = useMemoryForTesting;
  }

  /**
   * Handle orchestrator requests - manages workflow state and execution
   */
  public async handleRequest(input: OrchestratorInput) {
    this.logger.debug('Orchestrator tool called with input', input);
    try {
      const result = await this.processRequest(input);
      this.logger.debug('Orchestrator returning result', result);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result),
          },
        ],
        structuredContent: result,
      };
    } catch (error) {
      this.logger.error('Error in orchestrator tool execution', error as Error);
      throw error;
    }
  }

  private async processRequest(input: OrchestratorInput): Promise<OrchestratorOutput> {
    // Generate or use existing thread ID for workflow session
    const threadId = input.workflowStateData?.thread_id || generateUniqueThreadId();
    const workflowStateData: WorkflowStateData = { thread_id: threadId };

    this.logger.info('Processing orchestrator request', {
      threadId,
      hasUserInput: !!input.userInput,
      isResumption: !!input.workflowStateData?.thread_id,
    });

    // Thread configuration for LangGraph
    const threadConfig = { configurable: { thread_id: threadId } };

    // Initialize checkpointer for state persistence
    const checkpointer = createCheckpointer(this.useMemoryForTesting);

    // Compile workflow with checkpointer
    const compiledWorkflow = mobileNativeWorkflow.compile({ checkpointer });

    // Check for interrupted workflow state
    this.logger.debug('Checking for interrupted workflow state');
    let graphState = await compiledWorkflow.getState(threadConfig);
    const interruptedTask = graphState.tasks.find(task => task.interrupts.length > 0);

    let result: State;
    if (interruptedTask) {
      this.logger.info('Resuming interrupted workflow', {
        taskId: interruptedTask.id,
        interrupts: interruptedTask.interrupts.length,
      });

      // Resume workflow with user input from previous tool execution
      result = await compiledWorkflow.invoke(
        new Command({ resume: input.userInput }),
        threadConfig
      );
    } else {
      // Start new workflow session
      this.logger.info('Starting new workflow execution');
      result = await compiledWorkflow.invoke(
        {
          userInput: input.userInput,
        },
        threadConfig
      );
    }

    this.logger.debug('Processing workflow result');
    graphState = await compiledWorkflow.getState(threadConfig);
    if (graphState.next.length > 0) {
      // There are more nodes to execute.
      const mcpToolInvocationData: MCPToolInvocationData<z.ZodObject<z.ZodRawShape>> | undefined =
        '__interrupt__' in result
          ? (
              result.__interrupt__ as Array<{
                value: MCPToolInvocationData<z.ZodObject<z.ZodRawShape>>;
              }>
            )[0].value
          : undefined;

      if (!mcpToolInvocationData) {
        this.logger.error('Workflow completed without expected MCP tool invocation.');
        throw new Error('FATAL: Unexpected workflow state without an interrupt');
      }

      this.logger.info('Invoking next MCP tool', {
        toolName: mcpToolInvocationData.llmMetadata?.name,
      });

      // Create orchestration prompt
      const orchestrationPrompt = this.createOrchestrationPrompt(
        mcpToolInvocationData,
        workflowStateData
      );

      return {
        orchestrationInstructionsPrompt: orchestrationPrompt,
      };
    }

    // Workflow completed.
    return {
      orchestrationInstructionsPrompt: 'The workflow has completed successfully.',
    };
  }

  /**
   * Create orchestration prompt for LLM with embedded tool invocation data and workflow state
   */
  private createOrchestrationPrompt(
    mcpToolInvocationData: MCPToolInvocationData<z.ZodObject<z.ZodRawShape>>,
    workflowStateData: WorkflowStateData
  ): string {
    return `
# Your Role

You are participating in a workflow orchestration process. The current
(\`${this.toolMetadata.toolId}\`) MCP server tool is the orchestrator, and is sending
you instructions on what to do next. These instructions describe the next participating
MCP server tool to invoke, along with its input schema and input values.

# Your Task

Invoke the following MCP server tool:

**MCP Server Tool Name**: ${mcpToolInvocationData.llmMetadata?.name}
**MCP Server Tool Input Schema**:
\`\`\`json
${JSON.stringify(zodToJsonSchema(mcpToolInvocationData.llmMetadata?.inputSchema))}
\`\`\`
**MCP Server Tool Input Values**:
\`\`\`json
${JSON.stringify(mcpToolInvocationData.input)}
\`\`\`

## Additional Input: \`${WORKFLOW_PROPERTY_NAMES.workflowStateData}\`

\`${WORKFLOW_PROPERTY_NAMES.workflowStateData}\` is an additional input parameter that is
specified in the input schema above, and should be passed to the next MCP server tool
invocation, with the following object value:

\`\`\`json
${JSON.stringify(workflowStateData)}
\`\`\`

This represents opaque workflow state data that should be round-tripped back to the
\`${this.toolMetadata.toolId}\` MCP server tool orchestrator at the completion of the
next MCP server tool invocation, without modification. These instructions will be further
specified by the next MCP server tool invocation.

The MCP server tool you invoke will respond with its output, along with further
instructions for continuing the workflow.
`;
  }
}
