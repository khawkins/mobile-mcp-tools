import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AbstractTool } from './abstractTool.js';
import { WORKFLOW_PROPERTY_NAMES, WorkflowStateData } from '../../common/schemas/workflow.js';
import { ORCHESTRATOR_TOOL } from '../workflow/sfmobile-native-project-manager/metadata.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WorkflowToolMetadata } from '../../common/metadata.js';
import { Logger } from '../../logging/logger.js';

/**
 * Abstract base class for all workflow-participating tools.
 *
 * Note: the orchestrator tool is considered the controller of the workflow,
 * and for that reason extends the more general AbstractTool class.
 */
export abstract class AbstractWorkflowTool<
  TMetadata extends WorkflowToolMetadata<
    z.ZodObject<z.ZodRawShape>,
    z.ZodObject<z.ZodRawShape>,
    z.ZodObject<z.ZodRawShape>
  >,
> extends AbstractTool<TMetadata> {
  constructor(server: McpServer, toolMetadata: TMetadata, componentName?: string, logger?: Logger) {
    super(server, toolMetadata, componentName, logger);
  }

  /**
   * Utility method for tools to add post-invocation instructions
   * that guide the LLM back to the orchestrator for workflow continuation
   *
   * @param prompt The main tool response prompt
   * @param workflowStateData Workflow state data to round-trip back to orchestrator
   * @returns Complete prompt with post-invocation instructions
   */
  protected addPostInvocationInstructions(
    prompt: string,
    workflowStateData: WorkflowStateData
  ): string {
    const postInstructions = `

# Post-Tool-Invocation Instructions

## 1. Format the results from the execution of your task

The output of your task should conform to the following JSON schema:

\`\`\`json
${JSON.stringify(zodToJsonSchema(this.toolMetadata.resultSchema))}
\`\`\`

A string representation of this JSON schema can also be found in the \`resultSchema\`
field of this tool's output schema.

## 2. Invoke the next tool to continue the workflow

You MUST initiate the following actions to proceed with the in-progress workflow you are
participating in.

### 2.1. Invoke the \`${ORCHESTRATOR_TOOL.toolId}\` tool

Invoke the \`${ORCHESTRATOR_TOOL.toolId}\` tool, with the following input schema:

${JSON.stringify(zodToJsonSchema(ORCHESTRATOR_TOOL.inputSchema))}

### 2.2 Provide input values to the tool

Provide the following input values to the \`${ORCHESTRATOR_TOOL.toolId}\` tool, associated
with the input schema from the last step:

- \`${WORKFLOW_PROPERTY_NAMES.userInput}\`: The structured results from the execution of your task, as specified in the first Post-Tool-Invocation step.
- \`${WORKFLOW_PROPERTY_NAMES.workflowStateData}\`: ${JSON.stringify(workflowStateData)}

This will continue the workflow orchestration process.
`;

    return prompt + postInstructions;
  }
}
