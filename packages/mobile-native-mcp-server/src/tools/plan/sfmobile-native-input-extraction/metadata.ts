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
 * User Input Triage Tool Input Schema
 */
export const INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend({
  userUtterance: z
    .unknown()
    .describe(
      'Raw user input - can be text, structured data, or any format describing their request'
    ),
  propertiesToExtract: z
    .array(
      z
        .object({
          propertyName: z.string().describe('The name of the property'),
          description: z.string().describe('The description of the property'),
        })
        .describe('The name of the property and its description to correlate with the user input')
    )
    .describe('The array of properties to extract from the user input'),
});

export const INPUT_EXTRACTION_WORKFLOW_RESULT_SCHEMA = z.object({
  extractedProperties: z
    .record(
      z.string().describe('The name of the property'),
      z.unknown().nullable().describe('The value of the property')
    )
    .describe('Collection of structured properties extracted from user input'),
});

export type InputExtractionWorkflowInput = z.infer<typeof INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA>;

/**
 * User Input Triage Tool Metadata
 */
export const INPUT_EXTRACTION_TOOL: WorkflowToolMetadata<
  typeof INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA,
  typeof INPUT_EXTRACTION_WORKFLOW_RESULT_SCHEMA
> = {
  toolId: 'sfmobile-native-input-extraction',
  title: 'Input Extraction',
  description: 'Parses user input and extracts structured project properties',
  inputSchema: INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: INPUT_EXTRACTION_WORKFLOW_RESULT_SCHEMA,
} as const;
