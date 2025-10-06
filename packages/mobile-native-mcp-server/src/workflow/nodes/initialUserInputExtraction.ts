/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseNode } from './abstractBaseNode.js';
import { State, WORKFLOW_USER_INPUT_PROPERTIES } from '../metadata.js';
import {
  InputExtractionServiceInterface,
  InputExtractionService,
} from '../services/inputExtractionService.js';
import { ToolExecutor } from './toolExecutor.js';
import { Logger } from '../../logging/logger.js';

/**
 * Workflow node that extracts structured properties from initial user input.
 *
 * This node is responsible for the first phase of user input processing in the workflow.
 * It takes raw user input and attempts to extract as many workflow properties as possible
 * using LLM-based natural language understanding.
 *
 * The node uses the InputExtractionService to:
 * - Parse user input for property values
 * - Validate extracted values against property schemas
 * - Return only successfully extracted and validated properties
 *
 * Properties that cannot be extracted from the initial input will need to be collected
 * through subsequent prompting or multi-turn interaction.
 *
 * Dependencies are injectable for testing and flexibility.
 */
export class InitialUserInputExtractionNode extends BaseNode {
  private readonly extractionService: InputExtractionServiceInterface;

  /**
   * Creates a new InitialUserInputExtractionNode.
   *
   * @param extractionService - Service for property extraction (injectable for testing)
   * @param toolExecutor - Tool executor for service (optional, passed to service)
   * @param logger - Logger instance (optional, passed to service)
   */
  constructor(
    extractionService?: InputExtractionServiceInterface,
    toolExecutor?: ToolExecutor,
    logger?: Logger
  ) {
    super('triageUserInput');
    this.extractionService = extractionService ?? new InputExtractionService(toolExecutor, logger);
  }

  /**
   * Executes the initial user input extraction.
   *
   * Takes the raw user input from state and attempts to extract all workflow
   * properties defined in WORKFLOW_USER_INPUT_PROPERTIES.
   *
   * @param state - Current workflow state containing userInput
   * @returns Partial state with extracted properties (only those successfully extracted)
   */
  execute = (state: State): Partial<State> => {
    const result = this.extractionService.extractProperties(
      state.userInput,
      WORKFLOW_USER_INPUT_PROPERTIES
    );

    // Return extracted properties to be merged into workflow state
    return { ...result.extractedProperties };
  };
}
