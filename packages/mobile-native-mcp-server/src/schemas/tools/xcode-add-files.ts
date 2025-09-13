/**
 * Xcode Add Files Tool Schemas
 *
 * Input and output schemas for the Xcode file addition utility tool.
 */

import { z } from 'zod';
import { WORKFLOW_TOOL_BASE_INPUT_SCHEMA } from '../workflow.js';

/**
 * Xcode Add Files Tool Input Schema
 */
export const XCODE_ADD_FILES_INPUT_SCHEMA = z.object({
  projectPath: z.string().describe('Absolute path to the Xcode project directory'),
  xcodeProjectPath: z.string().describe('Path to the .xcodeproj file (e.g., "MyApp.xcodeproj")'),
  newFilePaths: z
    .array(z.string())
    .describe('Array of newly created file paths relative to project root'),
  targetName: z
    .string()
    .optional()
    .describe('Optional: specific target to add files to (defaults to main app target)'),
});

export type XcodeAddFilesInput = z.infer<typeof XCODE_ADD_FILES_INPUT_SCHEMA>;

/**
 * Extended input schema for workflow integration
 */
export const XCODE_ADD_FILES_WORKFLOW_INPUT_SCHEMA = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(
  XCODE_ADD_FILES_INPUT_SCHEMA.shape
);

/**
 * Xcode Add Files Tool Output Schema
 */
export const XCODE_ADD_FILES_OUTPUT_SCHEMA = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  command: z.string().describe('The Ruby command that was generated'),
  projectPath: z.string().describe('Absolute path to the Xcode project directory'),
  filePaths: z.array(z.string()).describe('Array of file paths that were processed'),
  targetName: z.string().optional().describe('Target name that files were added to'),
  message: z.string().describe('Human-readable status message'),
  error: z.string().optional().describe('Error message if operation failed'),
});

export type XcodeAddFilesOutput = z.infer<typeof XCODE_ADD_FILES_OUTPUT_SCHEMA>;
