/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AbstractTool } from './abstractTool.js';
import {
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  MCPWorkflowToolOutput,
  WORKFLOW_PROPERTY_NAMES,
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  WorkflowStateData,
  WorkflowToolMetadata,
} from '../../common/metadata.js';
import { Logger } from '../../logging/logger.js';

/**
 * Abstract base class for all workflow-participating tools.
 *
 * Workflow tools return guidance prompts that instruct the LLM to invoke the
 * orchestrator tool next, along with the necessary workflow state data.
 *
 * The orchestrator tool itself extends AbstractTool directly, as it controls
 * the workflow rather than participating in it.
 */
export abstract class AbstractWorkflowTool<
  TMetadata extends WorkflowToolMetadata<
    typeof WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
    z.ZodObject<z.ZodRawShape>,
    typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA
  >,
> extends AbstractTool<TMetadata> {
  protected readonly orchestratorToolId: string;

  constructor(
    server: McpServer,
    toolMetadata: TMetadata,
    orchestratorToolId: string, // ID of the orchestrator managing this workflow
    loggerComponentName?: string,
    logger?: Logger
  ) {
    super(server, toolMetadata, loggerComponentName, logger);
    this.orchestratorToolId = orchestratorToolId;
  }

  /**
   * Utility method for tools to add post-invocation instructions
   * that guide the LLM back to the orchestrator for workflow continuation.
   *
   * This does NOT invoke the orchestrator - it creates guidance prompts that
   * instruct the LLM to invoke the orchestrator tool next.
   *
   * @param prompt The main tool response prompt
   * @param workflowStateData Workflow state data to round-trip back to orchestrator
   * @param resultSchema The optional result schema to format the LLM's output.
   *                     If not provided, uses the tool's default result schema.
   * @returns Complete prompt with post-invocation instructions
   */
  protected finalizeWorkflowToolOutput(
    prompt: string,
    workflowStateData: WorkflowStateData,
    resultSchema?: TMetadata['resultSchema'] | string
  ): CallToolResult {
    let resultSchemaToUse = resultSchema ?? this.toolMetadata.resultSchema;
    if (!(typeof resultSchemaToUse === 'string')) {
      resultSchemaToUse = JSON.stringify(zodToJsonSchema(resultSchemaToUse));
    }

    // Create guidance instructions that tell the LLM to invoke the orchestrator next
    const postInstructions = `

# Post-Tool-Invocation Instructions

## 1. Format the results from the execution of your task

The output of your task should conform to the following JSON schema:

\`\`\`json
${resultSchemaToUse}
\`\`\`

A string representation of this JSON schema can also be found in the \`resultSchema\`
field of this tool's output schema.

## 2. Invoke the next tool to continue the workflow

You MUST initiate the following actions to proceed with the in-progress workflow you are
participating in.

### 2.1. Invoke the \`${this.orchestratorToolId}\` tool

Invoke the \`${this.orchestratorToolId}\` tool to continue the workflow.

### 2.2 Provide input values to the tool

Provide the following input values to the \`${this.orchestratorToolId}\` tool:

- \`${WORKFLOW_PROPERTY_NAMES.userInput}\`: The structured results from the execution of your task, as specified in the first Post-Tool-Invocation step.
- \`${WORKFLOW_PROPERTY_NAMES.workflowStateData}\`: ${JSON.stringify(workflowStateData)}

This will continue the workflow orchestration process.
`;

    const promptForLLM = prompt + postInstructions;
    const result: MCPWorkflowToolOutput = {
      promptForLLM,
      resultSchema: resultSchemaToUse,
    };
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result),
        },
      ],
      structuredContent: result,
    };
  }
}
