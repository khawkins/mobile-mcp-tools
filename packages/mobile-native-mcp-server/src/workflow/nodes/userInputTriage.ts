/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { MCPToolInvocationData } from '../../common/metadata.js';
import { USER_INPUT_TRIAGE_TOOL } from '../../tools/plan/sfmobile-native-user-input-triage/metadata.js';
import { State } from '../metadata.js';
import { AbstractSchemaNode } from './abstractSchemaNode.js';

export class UserInputTriageNode extends AbstractSchemaNode<
  typeof USER_INPUT_TRIAGE_TOOL.inputSchema,
  typeof USER_INPUT_TRIAGE_TOOL.resultSchema,
  typeof USER_INPUT_TRIAGE_TOOL.outputSchema
> {
  protected readonly workflowToolMetadata = USER_INPUT_TRIAGE_TOOL;

  constructor() {
    super('triageUserInput');
  }

  execute = (state: State): Partial<State> => {
    const toolInvocationData: MCPToolInvocationData<typeof this.workflowToolMetadata.inputSchema> =
      {
        llmMetadata: {
          name: USER_INPUT_TRIAGE_TOOL.toolId,
          description: USER_INPUT_TRIAGE_TOOL.description,
          inputSchema: USER_INPUT_TRIAGE_TOOL.inputSchema,
        },
        input: {
          userUtterance: state.userInput,
        },
      };

    const validatedResult = this.executeToolWithLogging(toolInvocationData);

    // Extract the structured properties and merge them into the workflow state
    const { extractedProperties } = validatedResult;

    return {
      // Only update state properties that were successfully extracted (not undefined)
      ...(extractedProperties.platform && { platform: extractedProperties.platform }),
      ...(extractedProperties.projectName && { projectName: extractedProperties.projectName }),
      ...(extractedProperties.packageName && { packageName: extractedProperties.packageName }),
      ...(extractedProperties.organization && { organization: extractedProperties.organization }),
      ...(extractedProperties.connectedAppClientId && {
        connectedAppClientId: extractedProperties.connectedAppClientId,
      }),
      ...(extractedProperties.connectedAppCallbackUri && {
        connectedAppCallbackUri: extractedProperties.connectedAppCallbackUri,
      }),
      ...(extractedProperties.loginHost && { loginHost: extractedProperties.loginHost }),
    };
  };
}
