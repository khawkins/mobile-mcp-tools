/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { MCPToolInvocationData } from '../../common/metadata.js';
import { State } from '../metadata.js';
import { AbstractSchemaNode } from './abstractSchemaNode.js';
import { DEPLOYMENT_TOOL } from '../../tools/run/sfmobile-native-deployment/metadata.js';

export class DeploymentNode extends AbstractSchemaNode<
  typeof DEPLOYMENT_TOOL.inputSchema,
  typeof DEPLOYMENT_TOOL.resultSchema,
  typeof DEPLOYMENT_TOOL.outputSchema
> {
  protected readonly workflowToolMetadata = DEPLOYMENT_TOOL;

  constructor() {
    super('deployApp');
  }

  execute = (state: State): Partial<State> => {
    const toolInvocationData: MCPToolInvocationData<typeof this.workflowToolMetadata.inputSchema> =
      {
        llmMetadata: {
          name: DEPLOYMENT_TOOL.toolId,
          description: DEPLOYMENT_TOOL.description,
          inputSchema: DEPLOYMENT_TOOL.inputSchema,
        },
        input: {
          platform: state.platform,
          projectPath: state.projectPath,
          buildType: state.buildType,
          targetDevice: state.targetDevice,
        },
      };

    const validatedResult = this.executeToolWithLogging(toolInvocationData);
    return {
      ...validatedResult,
    };
  };
}
