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
import {
  GetInputProperty,
  GetInputService,
  GetInputServiceProvider,
} from '../services/getInputService.js';
import { PropertyMetadataCollection } from '../../common/propertyMetadata.js';

/**
 * Workflow node requests user input for any unfulfilled required properties.
 *
 * This node is responsible for formulating a request to the user to provide input for
 * any unfulfilled required properties.
 *
 * The node uses the GetInputService to:
 * - Present any unfulfilled properties to the user
 * - Gather the user's input for one or more of those properties
 * - Return the user's input for the properties that were collected
 *
 */
export class GetUserInputNode extends BaseNode {
  private readonly requiredProperties: PropertyMetadataCollection;
  private readonly getInputService: GetInputServiceProvider;

  /**
   * Creates a new GetUserInputNode.
   *
   * @param requiredProperties - Collection of properties that must be collected from the user
   *                             (defaults to WORKFLOW_USER_INPUT_PROPERTIES for production use)
   * @param getInputService - Service for getting user input (injectable for testing)
   * @param toolExecutor - Tool executor for services (optional, passed to services)
   * @param logger - Logger instance (optional, passed to services)
   */
  constructor(
    requiredProperties?: PropertyMetadataCollection,
    getInputService?: GetInputServiceProvider,
    toolExecutor?: ToolExecutor,
    logger?: Logger
  ) {
    super('getUserInput');
    this.requiredProperties = requiredProperties ?? WORKFLOW_USER_INPUT_PROPERTIES;
    this.getInputService = getInputService ?? new GetInputService(toolExecutor, logger);
  }

  /**
   * Executes the user input gathering process:
   * 1. Determines which required properties have not been collected
   * 2. Forms up inputs for the properties that have not been collected
   * 3. Calls the GetInputService to gather the user's input for those properties
   *
   * @param state - Current workflow state containing userInput
   * @returns Partial state with all extracted properties (initial + prompted)
   */
  execute = (state: State): Partial<State> => {
    const unfulfilledProperties = this.getUnfulfilledProperties(state);
    const userResponse = this.getInputService.getInput(unfulfilledProperties);
    return { userInput: userResponse };
  };

  private getUnfulfilledProperties(state: State) {
    const unfulfilledProperties: PropertyMetadataCollection = {};
    for (const [propertyName, metadata] of Object.entries(this.requiredProperties)) {
      if (!state[propertyName as keyof State]) {
        unfulfilledProperties[propertyName] = metadata;
      }
    }

    const propertyArray: GetInputProperty[] = [];
    for (const [propertyName, metadata] of Object.entries(unfulfilledProperties)) {
      propertyArray.push({
        propertyName,
        friendlyName: metadata.friendlyName,
        description: metadata.description,
      });
    }
    return propertyArray;
  }
}
