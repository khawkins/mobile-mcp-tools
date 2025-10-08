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
You are an input gathering tool, responsible for explicitly requesting and gathering the
user's input for a given property.

# TASK
Your job is to ask the user a question and gather their input. The question has all of the
relevant context for the user to provide a meaningful response.

# CONTEXT
- Question to ask the user: "${input.question}"

# INSTRUCTIONS
1. Present the question from "CONTEXT" above, directly to the user.
2. Collect the user's response to the question.
3. Follow the the "Post-Tool-Invocation" instructions below, to return the user's
   response to the orchestrator.
`;
  }
}
