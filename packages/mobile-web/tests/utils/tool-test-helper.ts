import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../src/utils/util.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as util from '../../src/utils/util.js';

export interface ToolTestConfig {
  toolName: string;
  registerTool: (server: McpServer, annotations: McpToolAnnotations) => void;
  handleRequest: () => Promise<any>;
  typeDefinitionPath: string;
}

export function setupToolTest(config: ToolTestConfig) {
  let server = new McpServer({ name: 'test-server', version: '1.0.0' });
  let annotations: McpToolAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };

  beforeEach(() => {
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
    vi.clearAllMocks();
  });

  return {
    server,
    annotations,
    runCommonTests: () => {
      describe(`${config.toolName} Tool`, () => {
        it('should register the tool without throwing', () => {
          expect(() => config.registerTool(server, annotations)).not.toThrow();
        });

        it('should read the correct type definition file', async () => {
          const readFileSpy = vi.spyOn(util, 'readTypeDefinitionFile').mockResolvedValue('');
          await config.handleRequest();
          expect(readFileSpy).toHaveBeenCalledWith(config.typeDefinitionPath);
        });

        it('should return content with type definitions', async () => {
          const mockTypeDefinitions = 'mock type definitions';
          vi.spyOn(util, 'readTypeDefinitionFile').mockResolvedValue(mockTypeDefinitions);
          vi.spyOn(util, 'createServiceGroundingText').mockReturnValue('mock grounding text');

          const result = await config.handleRequest();
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

          const result = await config.handleRequest();
          expect(result).toEqual({
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