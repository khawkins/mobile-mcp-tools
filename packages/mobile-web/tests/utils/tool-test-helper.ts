/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BaseTool } from '../../src/tools/native-capabilities/baseTool.js';

export interface ToolTestConfig {
  toolName: string;
  toolClass: new (server: McpServer, annotations: ToolAnnotations) => BaseTool;
  typeDefinitionPath: string;
}

export function setupToolTest(config: ToolTestConfig) {
  let server = new McpServer({ name: 'test-server', version: '1.0.0' });
  let annotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
  let tool: BaseTool | undefined;

  beforeEach(() => {
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
    tool = new config.toolClass(server, annotations);
    vi.clearAllMocks();
  });

  return {
    server,
    annotations,
    tool,
    runCommonTests: () => {
      describe(`${config.toolName} Tool`, () => {
        it('should register the tool without throwing', () => {
          expect(() => tool?.register()).not.toThrow();
        });

        it('should read the correct type definition file', async () => {
          const readTypeDefinitionFileSpy = vi
            .spyOn(tool as any, 'readTypeDefinitionFile')
            .mockResolvedValue('');
          await tool?.['handleRequest']();
          expect(readTypeDefinitionFileSpy).toHaveBeenCalled();
        });

        it('should return content with type definitions', async () => {
          const mockTypeDefinitions = 'mock type definitions';
          const mockBaseCapability = 'mock base capability';
          const mockMobileCapabilities = 'mock mobile capabilities';
          vi.spyOn(tool as any, 'readTypeDefinitionFile').mockResolvedValue(mockTypeDefinitions);
          vi.spyOn(tool as any, 'readBaseCapability').mockResolvedValue(mockBaseCapability);
          vi.spyOn(tool as any, 'readMobileCapabilities').mockResolvedValue(mockMobileCapabilities);
          vi.spyOn(tool as any, 'createServiceGroundingText').mockReturnValue(
            'mock grounding text'
          );

          const result = await tool?.['handleRequest']();
          expect(result).toEqual({
            content: [
              {
                type: 'text',
                text: 'mock grounding text',
              },
            ],
          });
        });

        it('should handle errors when reading type definition file', async () => {
          const error = new Error('Failed to read file');
          vi.spyOn(tool as any, 'readTypeDefinitionFile').mockRejectedValue(error);

          const result = await tool?.['handleRequest']();
          expect(result).toEqual({
            isError: true,
            content: [
              {
                type: 'text',
                text: `Error: Unable to load ${config.toolName} type definitions.`,
              },
            ],
          });
        });
      });
    },
  };
}
