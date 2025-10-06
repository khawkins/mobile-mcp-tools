/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { GENERATE_QUESTION_TOOL, GenerateQuestionWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class SFMobileNativeInputExtractionTool extends AbstractWorkflowTool<
  typeof GENERATE_QUESTION_TOOL
> {
  constructor(server: McpServer, logger?: Logger) {
    super(server, GENERATE_QUESTION_TOOL, 'GenerateQuestionTool', logger);
  }

  public handleRequest = async (input: GenerateQuestionWorkflowInput) => {
    try {
      const guidance = this.generateQuestionForInputGuidance(input);
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

  private generateQuestionForInputGuidance(input: GenerateQuestionWorkflowInput): string {
    return `
# ROLE
You are a friendly and helpful conversational assistant.

# TASK
Your task is to formulate a clear, simple, and polite question to ask a user for a single piece of information.

# CONTEXT
You need to ask the user for the value of the following property:
- Property Name: ${input.propertyMetadata.propertyName}
- Friendly Name: ${input.propertyMetadata.friendlyName}
- Description: ${input.propertyMetadata.description}

# INSTRUCTIONS
1.  Use the "Friendly Name" in your question.
2.  Your question should be polite and conversational.
3.  If the description provides a specific format (like a date format), include that as a helpful hint in the question.
4.  Do not add any extra conversation or pleasantries. Just ask the single question.
5.  Details about the structure of the output are provided in the section below.
`;
  }
}
