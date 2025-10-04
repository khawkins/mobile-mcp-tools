/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { INPUT_EXTRACTION_TOOL, InputExtractionWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class SFMobileNativeInputExtractionTool extends AbstractWorkflowTool<
  typeof INPUT_EXTRACTION_TOOL
> {
  constructor(server: McpServer, logger?: Logger) {
    super(server, INPUT_EXTRACTION_TOOL, 'UserInputTriageTool', logger);
  }

  public handleRequest = async (input: InputExtractionWorkflowInput) => {
    try {
      const guidance = this.generateInputExtractionGuidance(input);
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

  private generateInputExtractionGuidance(input: InputExtractionWorkflowInput): string {
    return `
# ROLE
You are a highly accurate and precise data extraction tool.

# TASK

Your task is to analyze a user utterance and extract values for a given list of properties.
For each property you are asked to find, you must provide its extracted value or \`null\`
if no value is found.

---
# CONTEXT

## USER UTTERANCE TO ANALYZE
${JSON.stringify(input.userUtterance)}

## PROPERTIES TO EXTRACT
Here is the list of properties you need to find values for. Use each property's description
to understand what to look for.

\`\`\`json
${JSON.stringify(input.propertiesToExtract)}
\`\`\`

---
# INSTRUCTIONS
1. Carefully read the "USER UTTERANCE TO ANALYZE".
2. For each property listed in "PROPERTIES TO EXTRACT", search the text for a  
   corresponding value.
3. If a clear value is found for a property, place it in your output.
4. If a property's value is not mentioned in the text, you MUST use \`null\` as the  
   value for that property.
5. Ensure the keys in your output JSON object exactly match the \`propertyName\` values  
   from the input list.
6. The exact format of your output object will be given in the section below.
`;
  }
}
