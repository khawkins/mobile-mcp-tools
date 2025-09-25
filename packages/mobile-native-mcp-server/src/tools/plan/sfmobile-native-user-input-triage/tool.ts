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

  public handleRequest = async (input: UserInputTriageWorkflowInput) => {
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
  };

  private generateUserInputTriageGuidance(input: UserInputTriageWorkflowInput): string {
    return dedent`
      # User Input Triage for Mobile App Development

      You are tasked with parsing user requirements and extracting structured project properties for Salesforce native mobile app development.

      ## Your Task

      Analyze the following user input and extract relevant project properties:

      **User Input:**
      ${JSON.stringify(input.userUtterance)}

      ## ⚠️ CRITICAL REQUIREMENT - DO NOT PROCEED WITHOUT REQUIRED FIELDS ⚠️

      **YOU MUST NOT PROCEED TO THE NEXT STEP UNTIL ALL REQUIRED FIELDS ARE COLLECTED.**

      - ALL required fields specified in the provided JSON schema MUST be present.
      - All required fields specified in the provided JSON schema MUST be confidently derived FROM USER INPUT. If the user did not provide the field value with high confidence, you MUST consider the field value UNFULFILLED.

      If ANY required fields are missing after analyzing the user input:
      
      1. STOP IMMEDIATELY
      2. DO NOT proceed to the next step in the workflow
      3. DO NOT populate the schema with empty or placeholder values
      4. EXPLICITLY ask the user for EACH missing required field
      5. EXPLAIN why this information is necessary
      6. WAIT for the user's response with the missing information

      ## Analysis Guidelines

      Extract as much relevant information as possible from the user input:

      1. **Core Properties**:
         - Extract platform, project name, package name, and organization
         - For project name and package name, use information from the app description
         - Generate a proper package identifier format (e.g., com.company.appname)

      2. **Salesforce Configuration**:
         - Connected App Client ID and Callback URI are REQUIRED and cannot be assumed
         - Login Host is optional (e.g., login.salesforce.com, test.salesforce.com, custom domains)

      3. **Analysis Metadata**:
         - Provide confidence level (0.0 to 1.0) in your extractions
         - List any missing information
         - Document assumptions made during extraction
         - Suggest questions or defaults for any unclear information

      ## Example Scenarios

      ### Example 1: "I want to create an iOS app that displays my most recently used Salesforce Contacts"
      This would extract:
      - Platform: iOS (explicitly stated)
      - Project Name: "Salesforce Contacts" or "Recent Contacts"
      - Package Name: "com.company.salesforcecontacts" (with placeholder organization)
      - Missing: Organization name, Connected App Client ID, Connected App Callback URI
      
      CORRECT RESPONSE: Stop and ask for the missing required fields before proceeding.
      "I need some additional information before we can proceed. Could you please provide:
      1. Your organization name
      2. Your Salesforce Connected App Client ID
      3. Your Salesforce Connected App Callback URI"

      ### Example 2: "Build an Android app for Acme Corp that shows my Opportunities with OAuth login to our Salesforce org"
      This would extract:
      - Platform: Android
      - Project Name: "Acme Opportunities" 
      - Organization: "Acme Corp"
      - Package Name: "com.acmecorp.opportunities"
      - Missing: Connected App Client ID, Connected App Callback URI
      
      CORRECT RESPONSE: Stop and ask for the missing required fields before proceeding.
      "I need your Salesforce Connected App credentials before we can proceed. Please provide:
      1. Your Salesforce Connected App Client ID
      2. Your Salesforce Connected App Callback URI"

      ## Response Format

      Your response must strictly follow the expected JSON schema format. Be thorough in your analysis and provide helpful recommendations for any missing information.

      **Important**: If the user input is vague or incomplete for non-required fields, you may use reasonable defaults but clearly document them in your assumptions and recommendations. For required fields, you must obtain explicit values from the user.
    `;
  }
}
