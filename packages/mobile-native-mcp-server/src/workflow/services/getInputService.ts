/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { ToolExecutor } from '../nodes/toolExecutor.js';
import { Logger } from '../../logging/logger.js';
import {
  GET_INPUT_PROPERTY_SCHEMA,
  GET_INPUT_TOOL,
} from '../../tools/plan/sfmobile-native-get-input/metadata.js';
import { AbstractService } from './abstractService.js';

export type GetInputProperty = z.infer<typeof GET_INPUT_PROPERTY_SCHEMA>;

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
  getInput(unfulfilledProperties: GetInputProperty[]): unknown;
}

/**
 * Service for getting user input for a given question.
 *
 * This service extends AbstractService to leverage common tool execution
 * patterns including standardized logging and result validation.
 */
export class GetInputService extends AbstractService implements GetInputServiceProvider {
  /**
   * Creates a new GetInputService.
   *
   * @param toolExecutor - Tool executor for invoking the input tool (injectable for testing)
   * @param logger - Logger instance (injectable for testing)
   */
  constructor(toolExecutor?: ToolExecutor, logger?: Logger) {
    super('GetInputService', toolExecutor, logger);
  }

  getInput(unfulfilledProperties: GetInputProperty[]): unknown {
    this.logger.debug('Starting input request with properties', {
      unfulfilledProperties,
    });

    // Create tool invocation data
    const toolInvocationData: MCPToolInvocationData<typeof GET_INPUT_TOOL.inputSchema> = {
      llmMetadata: {
        name: GET_INPUT_TOOL.toolId,
        description: GET_INPUT_TOOL.description,
        inputSchema: GET_INPUT_TOOL.inputSchema,
      },
      input: {
        propertiesRequiringInput: unfulfilledProperties,
      },
    };

    // Execute tool with logging and validation
    const validatedResult = this.executeToolWithLogging(
      toolInvocationData,
      GET_INPUT_TOOL.resultSchema
    );

    return validatedResult.userUtterance;
  }
}
