/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { GetInputTool } from './tool.js';

/**
 * Configuration options for creating a Get Input Tool
 */
export interface GetInputToolOptions {
  /**
   * Optional prefix for the tool ID to avoid collisions in multi-server environments
   * @example 'mobile' → 'mobile-magen-get-input'
   * @example 'salesops' → 'salesops-magen-get-input'
   * @default undefined → 'magen-get-input'
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
 * Factory function to create a Get Input Tool with configurable tool ID
 *
 * @param server - The MCP server instance
 * @param options - Configuration options for the tool
 * @returns A configured Get Input Tool instance ready for registration
 *
 * @example
 * // Simple case - single MCP server
 * const getInputTool = createGetInputTool(server, {
 *   orchestratorToolId: 'my-orchestrator',
 * });
 * // Registers as: 'magen-get-input'
 *
 * @example
 * // Multi-server environment - avoid collisions
 * const getInputTool = createGetInputTool(server, {
 *   toolIdPrefix: 'mobile',
 *   orchestratorToolId: 'mobile-orchestrator',
 * });
 * // Registers as: 'mobile-magen-get-input'
 */
export function createGetInputTool(server: McpServer, options: GetInputToolOptions): GetInputTool {
  const toolId = options.toolIdPrefix
    ? `${options.toolIdPrefix}-magen-get-input`
    : 'magen-get-input';

  return new GetInputTool(server, toolId, options.orchestratorToolId, options.logger);
}
