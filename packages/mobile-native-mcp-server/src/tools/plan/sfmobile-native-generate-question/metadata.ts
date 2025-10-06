/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { z } from 'zod';
import '../../../common/zod-extensions.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WorkflowToolMetadata,
} from '../../../common/metadata.js';

/**
 * Generate Question Tool Input Schema
 */
export const GENERATE_QUESTION_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend({
  propertyMetadata: z
    .object({
      propertyName: z.string().describe('The name of the property'),
      friendlyName: z.string().describe('The friendly name of the property'),
      description: z.string().describe('The description of the property'),
    })
    .describe(
      'The metadata for the property to be queried, used to formulate a prompting question for input'
    ),
});

export const GENERATE_QUESTION_WORKFLOW_RESULT_SCHEMA = z.object({
  question: z
    .string()
    .describe(
      "The generateed question that will be used to query the user for the property's input"
    ),
});

export type GenerateQuestionWorkflowInput = z.infer<typeof GENERATE_QUESTION_WORKFLOW_INPUT_SCHEMA>;

/**
 * Generate Question Tool Metadata
 */
export const GENERATE_QUESTION_TOOL: WorkflowToolMetadata<
  typeof GENERATE_QUESTION_WORKFLOW_INPUT_SCHEMA,
  typeof GENERATE_QUESTION_WORKFLOW_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-generate-question',
  title: 'Generate Question for User Input',
  description:
    "Based on its input property, generates a question prompting the user for the property's input",
  inputSchema: GENERATE_QUESTION_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: GENERATE_QUESTION_WORKFLOW_RESULT_SCHEMA,
} as const;
