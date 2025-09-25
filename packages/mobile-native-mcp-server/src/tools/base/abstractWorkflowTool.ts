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
import { ORCHESTRATOR_TOOL } from '../workflow/sfmobile-native-project-manager/metadata.js';
import { Logger } from '../../logging/logger.js';

/**
 * Abstract base class for all workflow-participating tools.
 *
 * Note: the orchestrator tool is considered the controller of the workflow,
 * and for that reason extends the more general AbstractTool class.
 */
export abstract class AbstractWorkflowTool<
  TMetadata extends WorkflowToolMetadata<
    typeof WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
    z.ZodObject<z.ZodRawShape>,
    typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA
  >,
> extends AbstractTool<TMetadata> {
  constructor(
    server: McpServer,
    toolMetadata: TMetadata,
    loggerComponentName?: string,
    logger?: Logger
  ) {
    super(server, toolMetadata, loggerComponentName, logger);
  }

  /**
   * Utility method for tools to add post-invocation instructions
   * that guide the LLM back to the orchestrator for workflow continuation
   *
   * @param prompt The main tool response prompt
   * @param workflowStateData Workflow state data to round-trip back to orchestrator
   * @returns Complete prompt with post-invocation instructions
   */
  protected finalizeWorkflowToolOutput(
    prompt: string,
    workflowStateData: WorkflowStateData
  ): CallToolResult {
    const resultSchemaString = JSON.stringify(zodToJsonSchema(this.toolMetadata.resultSchema));
    const postInstructions = `

# Post-Tool-Invocation Instructions

## 1. Format the results from the execution of your task

The output of your task should conform to the following JSON schema:

\`\`\`json
${resultSchemaString}
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

    const promptForLLM = prompt + postInstructions;
    const result: MCPWorkflowToolOutput = {
      promptForLLM,
      resultSchema: resultSchemaString,
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
