/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { interrupt } from '@langchain/langgraph';
import { BaseNode } from './abstractBaseNode.js';
import {
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  WorkflowToolMetadata,
  MCPToolInvocationData,
} from '../../common/metadata.js';
import { Logger, createComponentLogger } from '../../logging/logger.js';

export abstract class AbstractSchemaNode<
  TInputSchema extends typeof WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  TResultSchema extends z.ZodObject<z.ZodRawShape>,
  TOutputSchema extends
    typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA = typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
> extends BaseNode {
  protected abstract readonly workflowToolMetadata: WorkflowToolMetadata<
    TInputSchema,
    TResultSchema,
    TOutputSchema
  >;

  protected readonly logger: Logger;
  protected readonly componentName: string;

  constructor(name: string) {
    super(name);
    this.componentName = `WorkflowNode:${this.constructor.name}`;
    this.logger = createComponentLogger(this.componentName);
  }

  /**
   * Protected method to execute a tool with logging around the interrupt
   * @param toolInvocationData The tool invocation data to pass to the interrupt
   * @returns The validated result from the tool execution
   */
  protected executeToolWithLogging(
    toolInvocationData: MCPToolInvocationData<TInputSchema>
  ): z.infer<TResultSchema> {
    this.logger.debug('Tool invocation data (pre-interrupt)', { toolInvocationData });

    const result = interrupt(toolInvocationData);

    this.logger.debug('Tool execution result (post-interrupt)', { result });

    const validatedResult = this.workflowToolMetadata.resultSchema.parse(result);
    return validatedResult;
  }
}
