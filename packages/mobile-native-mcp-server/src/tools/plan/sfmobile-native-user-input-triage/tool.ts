/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dedent from 'dedent';
import { Logger } from '../../../logging/logger.js';
import { USER_INPUT_TRIAGE_TOOL, UserInputTriageWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class SFMobileNativeUserInputTriageTool extends AbstractWorkflowTool<
  typeof USER_INPUT_TRIAGE_TOOL
> {
  constructor(server: McpServer, logger?: Logger) {
    super(server, USER_INPUT_TRIAGE_TOOL, 'UserInputTriageTool', logger);
  }

  public async handleRequest(input: UserInputTriageWorkflowInput) {
    try {
      const guidance = this.generateUserInputTriageGuidance(input);
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
  }

  private generateUserInputTriageGuidance(input: UserInputTriageWorkflowInput): string {
    return dedent`
      # User Input Triage for Mobile App Development

      You are tasked with parsing user requirements and extracting structured project properties for Salesforce native mobile app development.

      ## Your Task

      Analyze the following user input and extract relevant project properties:

      **User Input:**
      ${JSON.stringify(input.userUtterance)}

      ## Required Analysis

      You must provide a structured response that extracts as much relevant information as possible from the user input. Use intelligent inference where appropriate, but clearly document your assumptions.

      ### 1. Extract Core Properties

      Look for the following information in the user input:

      - **Platform**: Is this for iOS, Android, or both? If not specified, make a reasonable assumption based on context.
      - **Project Name**: Extract or infer a suitable project name from the app description.
      - **Package Name**: Generate a proper package identifier (e.g., com.company.appname).
      - **Organization**: Extract or infer the organization/company name.

      ### 2. Extract Salesforce Configuration (if mentioned)

      Look for any Salesforce-specific requirements:

      - **Connected App Client ID**: If the user mentions OAuth or Connected App configuration.
      - **Connected App Callback URI**: If OAuth flows are discussed.
      - **Login Host**: If specific Salesforce environments are mentioned (login.salesforce.com, test.salesforce.com, custom domains).

      ### 3. Provide Analysis Metadata

      For each extraction, provide:

      - **Confidence Level**: Rate your confidence (0.0 to 1.0) in the extracted properties.
      - **Missing Information**: List what critical information is missing from the user input.
      - **Assumptions**: Document any assumptions you made during extraction.
      - **Recommendations**: Suggest what questions should be asked or what defaults should be used.

      ## Example Scenarios

      ### Example 1: "I want to create an iOS app that displays my most recently used Salesforce Contacts"
      This would extract:
      - Platform: iOS (explicitly stated)
      - Project Name: "Salesforce Contacts" or "Recent Contacts"
      - Package Name: "com.company.salesforcecontacts" (with placeholder organization)
      - Missing: Organization name, Salesforce configuration details

      ### Example 2: "Build an Android app for Acme Corp that shows my Opportunities with OAuth login to our Salesforce org"
      This would extract:
      - Platform: Android
      - Project Name: "Acme Opportunities" 
      - Organization: "Acme Corp"
      - Package Name: "com.acmecorp.opportunities"
      - Missing: Specific OAuth configuration details

      ## Response Format

      Your response must strictly follow the expected JSON schema format. Be thorough in your analysis and provide helpful recommendations for any missing information.

      **Important**: If the user input is vague or incomplete, use reasonable defaults but clearly document them in your assumptions and recommendations.
    `;
  }
}
