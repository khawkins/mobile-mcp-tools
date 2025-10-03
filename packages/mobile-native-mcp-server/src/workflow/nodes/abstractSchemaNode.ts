/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { interrupt } from '@langchain/langgraph';
import { BaseNode } from './abstractBaseNode.js';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { Logger, createComponentLogger } from '../../logging/logger.js';

export abstract class AbstractSchemaNode extends BaseNode {
  protected readonly logger: Logger;
  protected readonly componentName: string;

  constructor(name: string) {
    super(name);
    this.componentName = `WorkflowNode:${this.constructor.name}`;
    this.logger = createComponentLogger(this.componentName);
  }

  /**
   * Protected method to execute a tool with logging around the interrupt.
   *
   * By default, results are validated using the provided Zod schema's parse method.
   * Pass a custom validator function to implement additional validation logic.
   *
   * @param toolInvocationData The tool invocation data to pass to the interrupt
   * @param resultSchema The schema to validate the result against
   * @param validator Optional custom validator function
   * @returns The validated result from the tool execution
   */
  protected executeToolWithLogging<TResultSchema extends z.ZodObject<z.ZodRawShape>>(
    toolInvocationData: MCPToolInvocationData<z.ZodObject<z.ZodRawShape>>,
    resultSchema: TResultSchema,
    validator?: (result: unknown, schema: TResultSchema) => z.infer<TResultSchema>
  ): z.infer<TResultSchema> {
    this.logger.debug('Tool invocation data (pre-interrupt)', { toolInvocationData });

    const result = interrupt(toolInvocationData);

    this.logger.debug('Tool execution result (post-interrupt)', { result });

    return validator ? validator(result, resultSchema) : resultSchema.parse(result);
  }
}
