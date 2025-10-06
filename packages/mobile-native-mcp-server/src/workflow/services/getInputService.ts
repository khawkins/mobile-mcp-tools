/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { MCPToolInvocationData } from '../../common/metadata.js';
import { ToolExecutor, LangGraphToolExecutor } from '../nodes/toolExecutor.js';
import { Logger, createComponentLogger } from '../../logging/logger.js';
import { GET_INPUT_TOOL } from '../../tools/plan/sfmobile-native-get-input/metadata.js';

/**
 * Provider interface for user input service.
 * This interface allows for dependency injection and testing.
 */
export interface GetInputServiceProvider {
  /**
   * Solicits user input with a given question.
   *
   * @param question - The question to ask the user
   * @returns The user's response (can be any type)
   */
  getInput(question: string): unknown;
}

/**
 * Service for getting user input for a given question.
 */
export class GetInputService implements GetInputServiceProvider {
  private readonly logger: Logger;
  private readonly toolExecutor: ToolExecutor;

  /**
   * Creates a new GetInputService.
   *
   * @param toolExecutor - Tool executor for invoking the extraction tool (injectable for testing)
   * @param logger - Logger instance (injectable for testing)
   */
  constructor(toolExecutor?: ToolExecutor, logger?: Logger) {
    this.toolExecutor = toolExecutor ?? new LangGraphToolExecutor();
    this.logger = logger ?? createComponentLogger('GetInputService');
  }

  getInput(question: string): unknown {
    this.logger.debug('Starting input request with question', {
      question,
    });

    // Create tool invocation data
    const toolInvocationData: MCPToolInvocationData<typeof GET_INPUT_TOOL.inputSchema> = {
      llmMetadata: {
        name: GET_INPUT_TOOL.toolId,
        description: GET_INPUT_TOOL.description,
        inputSchema: GET_INPUT_TOOL.inputSchema,
      },
      input: {
        question,
      },
    };

    this.logger.debug('Invoking request for input tool', { toolInvocationData });

    // Execute tool
    const rawResult = this.toolExecutor.execute(toolInvocationData);
    this.logger.debug('Tool execution completed', { rawResult });
    const validatedResult = GET_INPUT_TOOL.resultSchema.parse(rawResult);

    this.logger.info('Request for input completed', {
      userUtterance: validatedResult.userUtterance,
    });

    return validatedResult.userUtterance;
  }
}
