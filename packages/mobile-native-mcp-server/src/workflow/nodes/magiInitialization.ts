/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { State } from '../metadata.js';
import { BaseNode } from './abstractBaseNode.js';
// import { Logger } from '../../logging/logger.js';
import path from 'path';

export class MagiInitializationNode extends BaseNode {
  constructor() {
    //logger?: Logger
    super('magiInitialization');
  }

  execute = (_state: State): Partial<State> => {
    // Create the project directory in this deterministic node. Return the path.
    return {
      projectDirectory: path.join(process.cwd(), 'prd-generation'),
    };
  };
}
