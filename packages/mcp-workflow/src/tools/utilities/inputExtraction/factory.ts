/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { InputExtractionTool } from './tool.js';

/**
 * Configuration options for creating an Input Extraction Tool
 */
export interface InputExtractionToolOptions {
  /**
   * Optional prefix for the tool ID to avoid collisions in multi-server environments
   * @example 'mobile' → 'mobile-magen-input-extraction'
   * @example 'salesops' → 'salesops-magen-input-extraction'
   * @default undefined → 'magen-input-extraction'
   */
  toolIdPrefix?: string;

  /**
   * Orchestrator tool ID that this tool reports back to
   * @required
   */
  orchestratorToolId: string;

  /**
   * Optional logger instance for tool operations
   */
  logger?: Logger;
}

/**
 * Factory function to create an Input Extraction Tool with configurable tool ID
 *
 * @param server - The MCP server instance
 * @param options - Configuration options for the tool
 * @returns A configured Input Extraction Tool instance ready for registration
 *
 * @example
 * // Simple case - single MCP server
 * const inputExtractionTool = createInputExtractionTool(server, {
 *   orchestratorToolId: 'my-orchestrator',
 * });
 * // Registers as: 'magen-input-extraction'
 *
 * @example
 * // Multi-server environment - avoid collisions
 * const inputExtractionTool = createInputExtractionTool(server, {
 *   toolIdPrefix: 'mobile',
 *   orchestratorToolId: 'mobile-orchestrator',
 * });
 * // Registers as: 'mobile-magen-input-extraction'
 */
export function createInputExtractionTool(
  server: McpServer,
  options: InputExtractionToolOptions
): InputExtractionTool {
  const toolId = options.toolIdPrefix
    ? `${options.toolIdPrefix}-magen-input-extraction`
    : 'magen-input-extraction';

  return new InputExtractionTool(server, toolId, options.orchestratorToolId, options.logger);
}
