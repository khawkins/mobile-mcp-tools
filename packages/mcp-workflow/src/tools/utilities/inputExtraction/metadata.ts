/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { z } from 'zod';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WorkflowToolMetadata,
} from '../../../common/metadata.js';

/**
 * Input Extraction Tool Input Schema
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
  resultSchema: z
    .string()
    .describe('The JSON schema definining the extracted properties structure, as a string'),
});

// NOTE: This is a nominal definition, as the actual schema is dynamic, and needs to come
// through the input schema. Having this defined is an artifact of needing to reconsider
// our design for schema representation in our server tools.
export const INPUT_EXTRACTION_WORKFLOW_RESULT_SCHEMA = z.object({
  resultSchema: z
    .string()
    .describe('The JSON schema definining the extracted properties structure, as a string'),
});

export type InputExtractionWorkflowInput = z.infer<typeof INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA>;

/**
 * Input Extraction Tool Metadata Type
 */
export type InputExtractionToolMetadata = WorkflowToolMetadata<
  typeof INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA,
  typeof INPUT_EXTRACTION_WORKFLOW_RESULT_SCHEMA
>;

/**
 * Factory function to create Input Extraction Tool metadata with a dynamic tool ID
 *
 * @param toolId - The unique identifier for the tool (e.g., 'magen-input-extraction', 'mobile-magen-input-extraction')
 * @returns Tool metadata object for Input Extraction Tool
 */
export function createInputExtractionMetadata(toolId: string): InputExtractionToolMetadata {
  return {
    toolId,
    title: 'Input Extraction',
    description: 'Parses user input and extracts structured project properties',
    inputSchema: INPUT_EXTRACTION_WORKFLOW_INPUT_SCHEMA,
    outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
    resultSchema: INPUT_EXTRACTION_WORKFLOW_RESULT_SCHEMA,
  } as const;
}
