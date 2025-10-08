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

/**
 * Workflow node that extracts structured properties from user input.
 *
 * This node is responsible for user input processing in the workflow.
 * It takes raw user input and attempts to extract as many workflow properties as possible
 * using LLM-based natural language understanding.
 *
 * The node uses the InputExtractionService to:
 * - Parse user input for property values
 * - Validate extracted values against property schemas
 * - Return only successfully extracted and validated properties
 *
 * Properties that cannot be extracted from the input will need to be collected
 * through subsequent prompting or multi-turn interaction.
 *
 */
export class UserInputExtractionNode extends BaseNode {
  private readonly requiredProperties: PropertyMetadataCollection;
  private readonly extractionService: InputExtractionServiceProvider;

  /**
   * Creates a new UserInputExtractionNode.
   *
   * @param requiredProperties - Collection of properties that must be collected from user
   *                             (defaults to WORKFLOW_USER_INPUT_PROPERTIES for production use)
   * @param extractionService - Service for property extraction (injectable for testing)
   * @param toolExecutor - Tool executor for services (optional, passed to services)
   * @param logger - Logger instance (optional, passed to services)
   */
  constructor(
    requiredProperties?: PropertyMetadataCollection,
    extractionService?: InputExtractionServiceProvider,
    toolExecutor?: ToolExecutor,
    logger?: Logger
  ) {
    super('initialUserInputExtraction');
    this.requiredProperties = requiredProperties ?? WORKFLOW_USER_INPUT_PROPERTIES;
    this.extractionService = extractionService ?? new InputExtractionService(toolExecutor, logger);
  }

  /**
   * Executes the user input extraction process. Extracts properties from the user input
   * from the input state, compares to the list of required properties, and returns any
   * responsive properties from the user input.
   * @param state - Current workflow state containing userInput
   * @returns Partial state with all extracted properties
   */
  execute = (state: State): Partial<State> => {
    // Phase 1: Extract properties from initial user utterance
    const result = this.extractionService.extractProperties(
      state.userInput,
      this.requiredProperties
    );

    const extractedProperties = { ...result.extractedProperties };
    return extractedProperties;
  };
}
