import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as util from '../../src/utils/util.js';
import { BaseTool } from '../../src/tools/baseTool.js';

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
          const readFileSpy = vi.spyOn(util, 'readTypeDefinitionFile').mockResolvedValue('');
          await tool?.['handleRequest']();
          expect(readFileSpy).toHaveBeenCalledWith(config.typeDefinitionPath);
        });

        it('should return content with type definitions', async () => {
          const mockTypeDefinitions = 'mock type definitions';
          vi.spyOn(util, 'readTypeDefinitionFile').mockResolvedValue(mockTypeDefinitions);
          vi.spyOn(util, 'createServiceGroundingText').mockReturnValue('mock grounding text');

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
          vi.spyOn(util, 'readTypeDefinitionFile').mockRejectedValue(error);
          vi.spyOn(util, 'createServiceGroundingText').mockReturnValue('mock grounding text');

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
