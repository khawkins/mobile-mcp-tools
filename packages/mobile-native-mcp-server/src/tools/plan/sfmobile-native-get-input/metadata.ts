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
 * Get Input Tool Input Schema
 */
export const GET_INPUT_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend({
  question: z.string().describe('The question to pose to the user to get the input'),
});

export const GET_INPUT_WORKFLOW_RESULT_SCHEMA = z.object({
  userUtterance: z.unknown().describe("The user's response to the question"),
});

export type GetInputWorkflowInput = z.infer<typeof GET_INPUT_WORKFLOW_INPUT_SCHEMA>;

/**
 * Get Input Tool Metadata
 */
export const GET_INPUT_TOOL: WorkflowToolMetadata<
  typeof GET_INPUT_WORKFLOW_INPUT_SCHEMA,
  typeof GET_INPUT_WORKFLOW_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-get-input',
  title: 'Get User Input',
  description: 'Provides a question to the user to elicit their input for a given property',
  inputSchema: GET_INPUT_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: GET_INPUT_WORKFLOW_RESULT_SCHEMA,
} as const;
