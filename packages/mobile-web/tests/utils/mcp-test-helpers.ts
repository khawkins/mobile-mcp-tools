/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

// Reusable content item type
export interface ContentItem {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

// Type-safe tool response interface
export interface MockToolResponse {
  content: Array<ContentItem>;
  structuredContent?: unknown;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

// Type-safe tool handler type
export type MockToolHandler<TInput = unknown> = (
  input: TInput,
  extra?: {
    server: McpServer;
    request: {
      method: string;
      url?: string;
    };
  }
) => Promise<MockToolResponse> | MockToolResponse;

// Type-safe registered tool interface
export interface MockRegisteredTool {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  annotations: ToolAnnotations;
  handler: MockToolHandler;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  callback: MockToolHandler;
}

/**
 * Creates a pragmatic mock MCP server for testing
 * Bypasses complex generic constraints by focusing on test functionality
 */
export function createMockMcpServer() {
  const server = new McpServer({ name: 'test-server', version: '1.0.0' });
  const registeredHandlers: MockToolHandler[] = [];

  // Use a simpler mock that captures the handler without complex type constraints
  const registerToolSpy = vi
    .fn()
    .mockImplementation((_id: string, _config: unknown, handler: MockToolHandler) => {
      registeredHandlers.push(handler);
      return {
        name: _id,
        description: '',
        inputSchema: _config,
        outputSchema: _config,
        annotations: {},
        update: vi.fn(),
        remove: vi.fn(),
        callback: handler,
      };
    });

  // Replace the actual registerTool method.
  //
  // The double cast (to unknown, then to the target type) is used to bypass TypeScript's structural type checks.
  // This is necessary because the McpServer type likely does not declare a registerTool property as mutable or assignable,
  // and TypeScript would otherwise error. By casting to unknown first, we suppress type checking, then assert the shape we want.
  (server as unknown as { registerTool: typeof registerToolSpy }).registerTool = registerToolSpy;

  const getToolHandler = <TInput = unknown>(index = 0): MockToolHandler<TInput> => {
    const handler = registeredHandlers[index];
    if (!handler) {
      throw new Error(`No handler registered at index ${index}`);
    }
    return handler as MockToolHandler<TInput>;
  };

  return {
    server,
    registerToolSpy,
    getToolHandler,
  };
}

/**
 * Creates a mock tool response with proper typing
 */
export function createMockToolResponse(
  text: string,
  options: {
    structuredContent?: unknown;
    isError?: boolean;
    additionalContent?: Array<ContentItem>;
  } = {}
): MockToolResponse {
  return {
    content: [{ type: 'text', text }, ...(options.additionalContent || [])],
    structuredContent: options.structuredContent,
    isError: options.isError,
  };
}

/**
 * Standard annotations for testing
 */
export const defaultTestAnnotations: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/**
 * Helper to create mock request context
 */
export function createMockRequestContext(
  overrides: {
    method?: string;
    url?: string;
  } = {}
) {
  return {
    server: new McpServer({ name: 'test-server', version: '1.0.0' }),
    request: {
      method: overrides.method || 'POST',
      url: overrides.url || '/api/test',
    },
  };
}
