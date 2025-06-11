import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../../src/utils/util.js';
import {
  registerAppReviewTool,
  handleAppReviewRequest,
} from '../../../src/tools/appReview/tool.js';
import * as util from '../../../src/utils/util.js';

describe('App Review Tool', () => {
  let server: McpServer;
  let annotations: McpToolAnnotations;

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

  it('should register the tool without throwing', () => {
    expect(() => registerAppReviewTool(server, annotations)).not.toThrow();
  });

  it('should read the correct type definition file', async () => {
    const readFileSpy = vi.spyOn(util, 'readTypeDefinitionFile').mockResolvedValue('');
    await handleAppReviewRequest();
    expect(readFileSpy).toHaveBeenCalledWith('appReview/appReviewService.d.ts');
  });

  it('should return content with type definitions', async () => {
    const mockTypeDefinitions = 'mock type definitions';
    vi.spyOn(util, 'readTypeDefinitionFile').mockResolvedValue(mockTypeDefinitions);
    vi.spyOn(util, 'createServiceGroundingText').mockReturnValue('mock grounding text');

    const result = await handleAppReviewRequest();
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

    const result = await handleAppReviewRequest();
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error: Unable to load App Review type definitions.',
        },
      ],
    });
  });
});
