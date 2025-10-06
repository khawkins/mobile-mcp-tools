/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { GET_INPUT_TOOL, GetInputWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class SFMobileNativeGetInputTool extends AbstractWorkflowTool<typeof GET_INPUT_TOOL> {
  constructor(server: McpServer, logger?: Logger) {
    super(server, GET_INPUT_TOOL, 'GetInputTool', logger);
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
You are a system instruction formatter.

# TASK
Your job is to take a question and embed it into a standard response template that instructs
an MCP client on how to interact with a user and where to send their response.

# CONTEXT
- Question to ask the user: "${input.question}"
- Instructions for post-input navigation will be provided below.

# INSTRUCTIONS
Construct a prompt for the MCP client that includes the following:
1. The exact question to present to the user.
2. Instructions for post-input navigation, used to provide the user's response back to the orchestrator.
    - These instructions will be provided below.
`;
  }
}
