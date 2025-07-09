/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineGuidanceTool } from '../../../../src/tools/mobile-offline/offline-guidance/tool.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('OfflineGuidanceTool', () => {
  let tool: OfflineGuidanceTool;
  let server: McpServer;
  let annotations: ToolAnnotations;

  beforeEach(() => {
    tool = new OfflineGuidanceTool();
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
    vi.clearAllMocks();
  });

  describe('Tool Properties', () => {
    it('should have correct tool properties', () => {
      expect(tool.name).toBe('Mobile Web Offline Guidance Tool');
      expect(tool.description).toContain('expert review instructions');
      expect(tool.description).toContain('agentic offline violation analysis');
      expect(tool.toolId).toBe('sfmobile-web-offline-guidance');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
    });

    it('should have a meaningful description', () => {
      expect(tool.description).toContain('intelligent pattern recognition');
      expect(tool.description).toContain('contextual analysis');
      expect(tool.description).toContain('offline compatibility');
    });

    it('should require no input', () => {
      const inputShape = tool.inputSchema.shape;
      expect(Object.keys(inputShape)).toHaveLength(0);
    });
  });

  describe('Tool Registration', () => {
    it('should register the tool without throwing', () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      expect(() => tool.register(server, annotations)).not.toThrow();
      expect(registerToolSpy).toHaveBeenCalledWith(
        'sfmobile-web-offline-guidance',
        expect.objectContaining({
          description: tool.description,
          inputSchema: tool.inputSchema.shape,
          outputSchema: tool.outputSchema.shape,
          annotations: annotations,
        }),
        expect.any(Function)
      );
    });

    it('should register with correct tool ID', () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      tool.register(server, annotations);

      expect(registerToolSpy).toHaveBeenCalledWith(
        'sfmobile-web-offline-guidance',
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('Expert Review Instructions', () => {
    it('should return expert review instructions', async () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      tool.register(server, annotations);

      // Get the handler function that was passed to registerTool
      const handler = registerToolSpy.mock.calls[0][2] as (input: {}) => Promise<any>;

      const result = await handler({});

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
      expect(typeof result.content[0].text).toBe('string');
      expect(result.structuredContent).toBeDefined();
    });

    it('should return structured content with expert instructions', async () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      tool.register(server, annotations);

      const handler = registerToolSpy.mock.calls[0][2] as (input: {}) => Promise<any>;
      const result = await handler({});

      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent).toHaveProperty('expertInstructions');
      expect(result.structuredContent).toHaveProperty('orchestrationGuidance');
      expect(result.structuredContent).toHaveProperty('expectedResponseFormat');
      expect(Array.isArray(result.structuredContent.expertInstructions)).toBe(true);
      expect(result.structuredContent.expertInstructions.length).toBeGreaterThan(0);
    });

    it('should include conditional rendering expert instructions', async () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      tool.register(server, annotations);

      const handler = registerToolSpy.mock.calls[0][2] as (input: {}) => Promise<any>;
      const result = await handler({});

      const expertInstructions = result.structuredContent.expertInstructions;
      const conditionalRenderingExpert = expertInstructions.find(
        (expert: any) => expert.expertReviewerName === 'Conditional Rendering Compatibility Expert'
      );

      expect(conditionalRenderingExpert).toBeDefined();
      expect(conditionalRenderingExpert.violationCategory).toBe(
        'Unsupported Conditional Rendering'
      );
      expect(conditionalRenderingExpert.detectionGuidance).toContain('lwc:if');
      expect(conditionalRenderingExpert.detectionGuidance).toContain('lwc:elseif');
      expect(conditionalRenderingExpert.detectionGuidance).toContain('lwc:else');
      expect(conditionalRenderingExpert.analysisInstructions).toContain('if:true/if:false');
    });

    it('should include GraphQL wire expert instructions', async () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      tool.register(server, annotations);

      const handler = registerToolSpy.mock.calls[0][2] as (input: {}) => Promise<any>;
      const result = await handler({});

      const expertInstructions = result.structuredContent.expertInstructions;
      const graphqlWireExpert = expertInstructions.find(
        (expert: any) => expert.expertReviewerName === 'GraphQL Wire Configuration Expert'
      );

      expect(graphqlWireExpert).toBeDefined();
      expect(graphqlWireExpert.violationCategory).toBe('Inline GraphQL Queries in @wire Adapters');
      expect(graphqlWireExpert.detectionGuidance).toContain('@wire');
      expect(graphqlWireExpert.detectionGuidance).toContain('GraphQL');
      expect(graphqlWireExpert.analysisInstructions).toContain('getter method');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const registerToolSpy = vi
        .spyOn(server, 'registerTool')
        .mockImplementation((_id, _config, handler) => {
          return {
            callback: handler,
            enabled: true,
            enable: vi.fn(),
            disable: vi.fn(),
            name: _id,
            description: '',
            inputSchema: _config.inputSchema as any,
            outputSchema: _config.outputSchema as any,
            annotations: _config.annotations as any,
            update: vi.fn(),
            remove: vi.fn(),
          };
        });

      // Mock an error in the tool execution
      const originalGetExpertReviewInstructions = tool['getExpertReviewInstructions'];
      tool['getExpertReviewInstructions'] = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      tool.register(server, annotations);

      const handler = registerToolSpy.mock.calls[0][2] as (input: {}) => Promise<any>;
      const result = await handler({});

      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Failed to generate review instructions');
      expect(result.content[0].text).toContain('Test error');

      // Restore the original method
      tool['getExpertReviewInstructions'] = originalGetExpertReviewInstructions;
    });
  });
});
