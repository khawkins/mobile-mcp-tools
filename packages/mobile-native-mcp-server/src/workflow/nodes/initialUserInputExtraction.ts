/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { USER_INPUT_TRIAGE_TOOL } from '../../tools/plan/sfmobile-native-user-input-triage/metadata.js';
import { State, WORKFLOW_USER_INPUT_PROPERTIES, WorkflowUserInputProperties } from '../metadata.js';
import { AbstractSchemaNode } from './abstractSchemaNode.js';

export class InitialUserInputExtractionNode extends AbstractSchemaNode<
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
          propertiesToExtract: this.createExtractedProperties(),
        },
      };

    const validatedResult = this.executeToolWithLogging(toolInvocationData);

    // All of the extracted properties in validatedResult should now map to validated
    // values ready for entry into the workflow state.
    const { extractedProperties } = validatedResult;
    return { ...extractedProperties };
  };

  protected validateResult(result: unknown): z.infer<typeof USER_INPUT_TRIAGE_TOOL.resultSchema> {
    const validatedResult = super.validateResult(result);
    const { extractedProperties } = validatedResult;
    // Invalidate any proeprties that were not collected from the user.
    for (const [propertyName, value] of Object.entries(extractedProperties)) {
      if (!value) {
        delete extractedProperties[propertyName];
        continue;
      }
      const userInputProperty = this.getWorkflowPropertyValue(
        WORKFLOW_USER_INPUT_PROPERTIES,
        propertyName
      );
      if (!userInputProperty) {
        delete extractedProperties[propertyName];
        continue;
      }

      try {
        extractedProperties[propertyName] = userInputProperty.zodType.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          delete extractedProperties[propertyName];
          continue;
        }
        throw error;
      }
    }
    return validatedResult;
  }

  private getWorkflowPropertyValue<K extends keyof WorkflowUserInputProperties>(
    obj: WorkflowUserInputProperties,
    key: string
  ): WorkflowUserInputProperties[K] | undefined {
    if (key in obj) {
      return obj[key as K]; // safe cast after runtime check
    }
    return undefined;
  }

  private createExtractedProperties() {
    const propertiesToExtract: { propertyName: string; description: string }[] = [];
    for (const propertyName of Object.keys(
      WORKFLOW_USER_INPUT_PROPERTIES
    ) as (keyof WorkflowUserInputProperties)[]) {
      const propertyMetadata = WORKFLOW_USER_INPUT_PROPERTIES[propertyName];
      propertiesToExtract.push({
        propertyName,
        description: propertyMetadata.description,
      });
    }
    return propertiesToExtract;
  }
}
