/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { MCPToolInvocationData } from '../../common/metadata.js';
import { State } from '../metadata.js';
import { AbstractSchemaNode } from './abstractSchemaNode.js';
import { FINISH_TOOL } from '../../tools/workflow/sfmobile-native-completion/metadata.js';

export class CompletionNode extends AbstractSchemaNode<
  typeof FINISH_TOOL.inputSchema,
  typeof FINISH_TOOL.resultSchema,
  typeof FINISH_TOOL.outputSchema
> {
  protected readonly workflowToolMetadata = FINISH_TOOL;

  constructor() {
    super('finish');
  }

  execute = (state: State): Partial<State> => {
    const toolInvocationData: MCPToolInvocationData<typeof this.workflowToolMetadata.inputSchema> =
      {
        llmMetadata: {
          name: FINISH_TOOL.toolId,
          description: FINISH_TOOL.description,
          inputSchema: FINISH_TOOL.inputSchema,
        },
        input: {
          projectPath: state.projectPath,
        },
      };

    const validatedResult = this.executeToolWithLogging(toolInvocationData);
    return {
      ...validatedResult,
    };
  };
}
