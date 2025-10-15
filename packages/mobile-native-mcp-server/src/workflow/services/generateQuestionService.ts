/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { PropertyMetadata } from '../../common/propertyMetadata.js';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { ToolExecutor } from '../nodes/toolExecutor.js';
import { Logger } from '../../logging/logger.js';
import { GENERATE_QUESTION_TOOL } from '../../tools/plan/sfmobile-native-generate-question/metadata.js';
import { AbstractService } from './abstractService.js';

/**
 * Provider interface for question generation service.
 * This interface allows for dependency injection and testing.
 */
export interface GenerateQuestionServiceProvider {
  /**
   * Generates a question to prompt the user for a specific property value.
   *
   * @param name - The property name
   * @param metadata - The property metadata containing description and friendly name
   * @returns The generated question string
   */
  generateQuestionForProperty(name: string, metadata: PropertyMetadata<z.ZodTypeAny>): string;
}

/**
 * Service for generating a question to ask the user, as an input prompt for a property.
 *
 * This service extends AbstractService to leverage common tool execution
 * patterns including standardized logging and result validation.
 */
export class GenerateQuestionService
  extends AbstractService
  implements GenerateQuestionServiceProvider
{
  /**
   * Creates a new GenerateQuestionService.
   *
   * @param toolExecutor - Tool executor for invoking the question generation tool (injectable for testing)
   * @param logger - Logger instance (injectable for testing)
   */
  constructor(toolExecutor?: ToolExecutor, logger?: Logger) {
    super('GenerateQuestionService', toolExecutor, logger);
  }

  generateQuestionForProperty(name: string, metadata: PropertyMetadata<z.ZodTypeAny>): string {
    this.logger.debug('Starting question generation for property', {
      name,
      metadata,
    });

    // Create tool invocation data
    const toolInvocationData: MCPToolInvocationData<typeof GENERATE_QUESTION_TOOL.inputSchema> = {
      llmMetadata: {
        name: GENERATE_QUESTION_TOOL.toolId,
        description: GENERATE_QUESTION_TOOL.description,
        inputSchema: GENERATE_QUESTION_TOOL.inputSchema,
      },
      input: {
        propertyMetadata: {
          propertyName: name,
          friendlyName: metadata.friendlyName,
          description: metadata.description,
        },
      },
    };

    // Execute tool with logging and validation
    const validatedResult = this.executeToolWithLogging(
      toolInvocationData,
      GENERATE_QUESTION_TOOL.resultSchema
    );

    return validatedResult.question;
  }
}
