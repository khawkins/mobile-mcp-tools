/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { State } from '../metadata.js';
import { BaseNode } from './abstractBaseNode.js';

export class EnvironmentValidationNode extends BaseNode {
  constructor() {
    super('validateEnvironment');
  }

  execute = (_state: State): Partial<State> => {
    // TODO: Implement environment validation.
    return {
      environmentValidated: true,
    };
  };
}
