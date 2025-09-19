/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { SFMobileNativeTemplateDiscoveryTool } from '../../../../src/tools/plan/sfmobile-native-template-discovery/tool.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

// Mock MCP Server implementation for testing
class MockMcpServer {
  public readonly registeredTools: Array<{
    toolId: string;
    config: any;
    handler: any;
  }> = [];

  registerTool(toolId: string, config: any, handler: any): void {
    this.registeredTools.push({ toolId, config, handler });
  }

  reset(): void {
    this.registeredTools.length = 0;
  }
}

describe('SFMobileNativeTemplateDiscoveryTool', () => {
  let tool: SFMobileNativeTemplateDiscoveryTool;
  let mockServer: MockMcpServer;
  let annotations: ToolAnnotations;

  beforeEach(() => {
    mockServer = new MockMcpServer();
    tool = new SFMobileNativeTemplateDiscoveryTool(mockServer as any);
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };

    mockServer.reset();
  });

  describe('Tool Properties', () => {
    it('should have correct tool metadata', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-template-discovery');
      expect(tool.toolMetadata.title).toBe('Salesforce Mobile Native Template Discovery');
      expect(tool.toolMetadata.description).toBe(
        'Guides LLM through template discovery and selection for Salesforce mobile app development'
      );
      // All tools now support workflow by default - no separate property needed
      expect(tool.toolMetadata.inputSchema).toBeDefined();
    });

    it('should implement WorkflowTool interface', () => {
      // All tools now support workflow by default - no separate property needed
    });
  });

  describe('Tool Registration', () => {
    it('should register with registerTool method', () => {
      tool.register(annotations);

      expect(mockServer.registeredTools).toHaveLength(1);

      const registeredTool = mockServer.registeredTools[0];
      expect(registeredTool.toolId).toBe('sfmobile-native-template-discovery');
      expect(registeredTool.config.description).toBe(tool.toolMetadata.description);
      expect(registeredTool.config.inputSchema).toBeDefined();
      expect(registeredTool.config.outputSchema).toBeDefined();
      expect(registeredTool.handler).toBeDefined();
    });

    it('should merge annotations correctly', () => {
      tool.register(annotations);

      const registeredTool = mockServer.registeredTools[0];
      expect(registeredTool.config.readOnlyHint).toBe(true);
      expect(registeredTool.config.destructiveHint).toBe(false);
      expect(registeredTool.config.title).toBe(tool.toolMetadata.title);
    });
  });

  describe('Input Schema', () => {
    it('should accept platform parameter', () => {
      const validInput = { platform: 'iOS' as const };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept workflow state data', () => {
      const validInput = {
        platform: 'Android' as const,
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform values', () => {
      const invalidInput = { platform: 'Windows' };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
