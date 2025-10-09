/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { State } from '../metadata.js';

/**
 * Conditional router edge to see whether the user's environment is valid.
 */
export class CheckEnvironmentValidatedRouter {
  private readonly environmentValidatedNodeName: string;
  private readonly invalidEnvironmentNodeName: string;

  /**
   * Creates a new CheckEnvironmentValidatedRouter.
   *
   * @param environmentValidatedNodeName - The name of the node to route to if the environment is valid
   * @param invalidEnvironmentNodeName - The name of the node to route to if the environment is invalid
   */
  constructor(environmentValidatedNodeName: string, invalidEnvironmentNodeName: string) {
    this.environmentValidatedNodeName = environmentValidatedNodeName;
    this.invalidEnvironmentNodeName = invalidEnvironmentNodeName;
  }

  execute = (state: State): string => {
    return state.validEnvironment
      ? this.environmentValidatedNodeName
      : this.invalidEnvironmentNodeName;
  };
}
