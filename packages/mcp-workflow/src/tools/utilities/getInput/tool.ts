/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { GetInputWorkflowInput, GetInputToolMetadata, createGetInputMetadata } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class GetInputTool extends AbstractWorkflowTool<GetInputToolMetadata> {
  constructor(server: McpServer, toolId: string, orchestratorToolId: string, logger?: Logger) {
    super(server, createGetInputMetadata(toolId), orchestratorToolId, 'GetInputTool', logger);
  }

  public handleRequest = async (input: GetInputWorkflowInput) => {
    try {
      const guidance = this.generatePromptForInputGuidance(input);
      return this.finalizeWorkflowToolOutput(guidance, input.workflowStateData);
    } catch (error) {
      const toolError = error instanceof Error ? error : new Error('Unknown error occurred');
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: ${toolError.message}`,
          },
        ],
      };
    }
  };

  private generatePromptForInputGuidance(input: GetInputWorkflowInput): string {
    return `
# ROLE
You are an input gathering tool, responsible for explicitly requesting and gathering the
user's input for a set of unfulfilled properties.

# TASK
Your job is to provide a prompt to the user that outlines the details for a set of properties
that require the user's input. The prompt should be polite and conversational.

# CONTEXT
Here is the list of properties that require the user's input, along with their describing
metadata:

${this.generatePropertiesDescription(input)}

# INSTRUCTIONS
1. Based on the properties listed in "CONTEXT", generate a prompt that outlines the details
   for each property.
2. Present the prompt to the user and instruct the user to provide their input.
3. **IMPORTANT:** YOU MUST NOW WAIT for the user to provide a follow-up response to your prompt.
    1. You CANNOT PROCEED FROM THIS STEP until the user has provided THEIR OWN INPUT VALUE.
4. Follow the the "Post-Tool-Invocation" instructions below, to return the user's
   response to the orchestrator for further processing.
`;
  }

  /**
   * Creates a "prompt-friendly" description of the properties requiring input, for inclusion
   * in the prompt to the LLM.
   * @param input The input to the tool, containing the properties requiring input
   * @returns A "prompt-friendly" description of the properties requiring input
   */
  private generatePropertiesDescription(input: GetInputWorkflowInput): string {
    return input.propertiesRequiringInput
      .map(
        property =>
          `- Property Name: ${property.propertyName}\n- Friendly Name: ${property.friendlyName}\n- Description: ${property.description}`
      )
      .join('\n\n');
  }
}
