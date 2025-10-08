/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseNode } from './abstractBaseNode.js';
import { State } from '../metadata.js';
import { ToolExecutor } from './toolExecutor.js';
import { Logger } from '../../logging/logger.js';
import { GetInputService, GetInputServiceProvider } from '../services/getInputService.js';

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
export class GetUserInputNode extends BaseNode {
  private readonly getInputService: GetInputServiceProvider;

  /**
   * Creates a new InitialUserInputNode.
   *
   * @param getInputService - Service for getting user input (injectable for testing)
   * @param toolExecutor - Tool executor for services (optional, passed to services)
   * @param logger - Logger instance (optional, passed to services)
   */
  constructor(
    getInputService?: GetInputServiceProvider,
    toolExecutor?: ToolExecutor,
    logger?: Logger
  ) {
    super('getUserInput');
    this.getInputService = getInputService ?? new GetInputService(toolExecutor, logger);
  }

  /**
   * Executes the complete user input gathering process:
   * 1. Extracts properties from the initial user utterance
   * 2. Identifies any unfulfilled required properties
   * 3. Prompts the user for each missing property in a multi-turn interaction
   * 4. Validates and incorporates each response
   *
   * This node implements a conversational loop that continues until all required
   * workflow properties have been successfully collected.
   *
   * @param state - Current workflow state containing userInput
   * @returns Partial state with all extracted properties (initial + prompted)
   */
  execute = (state: State): Partial<State> => {
    const userResponse = this.getInputService.getInput(state.userInputQuestion);
    return { userInput: userResponse };
  };
}
