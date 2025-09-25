/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { z } from 'zod';
import '../../../common/zod-extensions.js';
import { PLATFORM_ENUM } from '../../../common/schemas.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WorkflowToolMetadata,
} from '../../../common/metadata.js';

/**
 * User Input Triage Tool Input Schema
 */
export const USER_INPUT_TRIAGE_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend({
  userUtterance: z
    .unknown()
    .describe(
      'Raw user input - can be text, structured data, or any format describing their mobile app requirements'
    ),
});

export const USER_INPUT_TRIAGE_WORKFLOW_RESULT_SCHEMA = z.object({
  extractedProperties: z
    .object({
      platform: PLATFORM_ENUM
        .describe('Target mobile platform extracted from user requirements')
        .notAssumable(),
      projectName: z
        .string()
        .describe('Project name derived from user requirements or app description'),
      packageName: z
        .string()
        .describe('Package/bundle identifier (e.g., com.company.appname)'),
      organization: z.string().describe('Organization or company name'),
      connectedAppClientId: z
        .string()
        .describe('Salesforce Connected App Client ID if specified')
        .notAssumable(),
      connectedAppCallbackUri: z
        .string()
        .describe('Salesforce Connected App callback URI if specified')
        .notAssumable(),
      loginHost: z
        .string()
        .optional()
        .describe('Salesforce login host (e.g., login.salesforce.com, test.salesforce.com)'),
    })
    .describe('Structured properties extracted from user input'),

  analysisDetails: z
    .object({
      confidenceLevel: z
        .number()
        .min(0)
        .max(1)
        .describe('Confidence level (0-1) in the extracted properties'),
      missingInformation: z
        .array(z.string())
        .describe('List of required information that could not be extracted from user input'),
      assumptions: z.array(z.string()).describe('Assumptions made during extraction process'),
      recommendations: z
        .array(z.string())
        .describe('Recommendations for the user or next steps in the workflow'),
    })
    .describe('Analysis metadata about the extraction process'),
});

export type UserInputTriageWorkflowInput = z.infer<typeof USER_INPUT_TRIAGE_WORKFLOW_INPUT_SCHEMA>;

/**
 * User Input Triage Tool Metadata
 */
export const USER_INPUT_TRIAGE_TOOL: WorkflowToolMetadata<
  typeof USER_INPUT_TRIAGE_WORKFLOW_INPUT_SCHEMA,
  typeof USER_INPUT_TRIAGE_WORKFLOW_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-user-input-triage',
  title: 'User Input Triage',
  description:
    'Parses user requirements and extracts structured project properties for mobile app development workflow',
  inputSchema: USER_INPUT_TRIAGE_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: USER_INPUT_TRIAGE_WORKFLOW_RESULT_SCHEMA,
} as const;
