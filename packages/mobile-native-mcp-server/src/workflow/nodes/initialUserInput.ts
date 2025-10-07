/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseNode } from './abstractBaseNode.js';
import { State, WORKFLOW_USER_INPUT_PROPERTIES } from '../metadata.js';
import {
  InputExtractionServiceProvider,
  InputExtractionService,
} from '../services/inputExtractionService.js';
import { ToolExecutor } from './toolExecutor.js';
import { Logger } from '../../logging/logger.js';
import { PropertyMetadataCollection } from '../../common/propertyMetadata.js';
import {
  GenerateQuestionService,
  GenerateQuestionServiceProvider,
} from '../services/generateQuestionService.js';
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
export class InitialUserInputNode extends BaseNode {
  private readonly requiredProperties: PropertyMetadataCollection;
  private readonly extractionService: InputExtractionServiceProvider;
  private readonly generateQuestionService: GenerateQuestionServiceProvider;
  private readonly getInputService: GetInputServiceProvider;

  /**
   * Creates a new InitialUserInputNode.
   *
   * @param requiredProperties - Collection of properties that must be collected from user
   *                             (defaults to WORKFLOW_USER_INPUT_PROPERTIES for production use)
   * @param extractionService - Service for property extraction (injectable for testing)
   * @param generateQuestionService - Service for question generation (injectable for testing)
   * @param getInputService - Service for getting user input (injectable for testing)
   * @param toolExecutor - Tool executor for services (optional, passed to services)
   * @param logger - Logger instance (optional, passed to services)
   */
  constructor(
    requiredProperties?: PropertyMetadataCollection,
    extractionService?: InputExtractionServiceProvider,
    generateQuestionService?: GenerateQuestionServiceProvider,
    getInputService?: GetInputServiceProvider,
    toolExecutor?: ToolExecutor,
    logger?: Logger
  ) {
    super('triageUserInput');
    this.requiredProperties = requiredProperties ?? WORKFLOW_USER_INPUT_PROPERTIES;
    this.extractionService = extractionService ?? new InputExtractionService(toolExecutor, logger);
    this.generateQuestionService =
      generateQuestionService ?? new GenerateQuestionService(toolExecutor, logger);
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
    // Phase 1: Extract properties from initial user utterance
    const result = this.extractionService.extractProperties(
      state.userInput,
      this.requiredProperties
    );

    const extractedProperties = { ...result.extractedProperties };

    // Phase 2: Multi-turn collection for unfulfilled properties
    // Continue prompting until all required properties are collected
    let unfulfilledProperties = this.getUnfulfilledProperties(extractedProperties);

    while (Object.keys(unfulfilledProperties).length > 0) {
      // Get the first unfulfilled property to prompt about
      const [firstPropertyName, firstPropertyMetadata] = Object.entries(unfulfilledProperties)[0];

      // Generate a contextual question for this property
      const question = this.generateQuestionService.generateQuestionForProperty(
        firstPropertyName,
        firstPropertyMetadata
      );

      // Get user's response
      const userResponse = this.getInputService.getInput(question);

      // Attempt to extract ANY unfulfilled properties from the response
      // This allows users to provide multiple answers at once if they choose
      const { extractedProperties: responseProperties } = this.extractionService.extractProperties(
        userResponse,
        unfulfilledProperties
      );

      // Add all successfully extracted properties to our collection
      for (const [extractedName, extractedValue] of Object.entries(responseProperties)) {
        if (extractedValue !== undefined) {
          extractedProperties[extractedName] = extractedValue;
        }
      }

      // Re-check for any remaining unfulfilled properties
      unfulfilledProperties = this.getUnfulfilledProperties(extractedProperties);
    }

    // Return all collected properties to be merged into workflow state
    return extractedProperties;
  };

  /**
   * Identifies which required workflow properties have not yet been collected.
   *
   * @param fulfilledProperties - Properties that have already been collected
   * @returns Collection of property metadata for unfulfilled properties
   */
  private getUnfulfilledProperties(fulfilledProperties: Record<string, unknown>) {
    const unfulfilledProperties: PropertyMetadataCollection = {};
    for (const [propertyName, metadata] of Object.entries(this.requiredProperties)) {
      if (!fulfilledProperties[propertyName]) {
        unfulfilledProperties[propertyName] = metadata;
      }
    }
    return unfulfilledProperties;
  }
}
