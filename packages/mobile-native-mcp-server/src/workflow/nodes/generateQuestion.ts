/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseNode } from './abstractBaseNode.js';
import { State, WORKFLOW_USER_INPUT_PROPERTIES } from '../metadata.js';
import { ToolExecutor } from './toolExecutor.js';
import { Logger } from '../../logging/logger.js';
import { PropertyMetadataCollection } from '../../common/propertyMetadata.js';
import {
  GenerateQuestionService,
  GenerateQuestionServiceProvider,
} from '../services/generateQuestionService.js';

/**
 * Workflow node that generates a question for the user, based on the context of
 * the first unfulfilled property.
 */
export class GenerateQuestionNode extends BaseNode {
  private readonly requiredProperties: PropertyMetadataCollection;
  private readonly generateQuestionService: GenerateQuestionServiceProvider;

  /**
   * Creates a new GenerateQuestionNode.
   *
   * @param requiredProperties - Collection of properties that must be collected from user
   *                             (defaults to WORKFLOW_USER_INPUT_PROPERTIES for production use)
   * @param generateQuestionService - Service for question generation (injectable for testing)
   * @param toolExecutor - Tool executor for services (optional, passed to services)
   * @param logger - Logger instance (optional, passed to services)
   */
  constructor(
    requiredProperties?: PropertyMetadataCollection,
    generateQuestionService?: GenerateQuestionServiceProvider,
    toolExecutor?: ToolExecutor,
    logger?: Logger
  ) {
    super('generateQuestion');
    this.requiredProperties = requiredProperties ?? WORKFLOW_USER_INPUT_PROPERTIES;
    this.generateQuestionService =
      generateQuestionService ?? new GenerateQuestionService(toolExecutor, logger);
  }

  /**
   * Generates a question for the first unfulfilled property.
   * @param state - Current workflow state containing potentially unfulfilled properties
   * @returns Partial state with the generated question
   */
  execute = (state: State): Partial<State> => {
    const unfulfilledProperties = this.getUnfulfilledProperties(state);

    // Get the first unfulfilled property to prompt about
    const [firstPropertyName, firstPropertyMetadata] = Object.entries(unfulfilledProperties)[0];

    // Generate a contextual question for this property
    const userInputQuestion = this.generateQuestionService.generateQuestionForProperty(
      firstPropertyName,
      firstPropertyMetadata
    );

    return { userInputQuestion };
  };

  /**
   * Identifies which required workflow properties have not yet been collected.
   *
   * @param state - Current workflow state containing potentially unfulfilled properties
   * @returns Collection of property metadata for unfulfilled properties
   */
  private getUnfulfilledProperties(state: State) {
    const unfulfilledProperties: PropertyMetadataCollection = {};
    for (const [propertyName, metadata] of Object.entries(this.requiredProperties)) {
      if (!state[propertyName as keyof State]) {
        unfulfilledProperties[propertyName] = metadata;
      }
    }
    return unfulfilledProperties;
  }
}
