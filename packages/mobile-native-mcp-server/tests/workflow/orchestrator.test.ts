import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MobileNativeOrchestrator } from '../../src/tools/workflow/sfmobile-native-project-manager/tool.js';
import { MockLogger } from '../utils/MockLogger.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('MobileNativeOrchestrator', () => {
  let mockServer: McpServer;
  let mockLogger: MockLogger;
  let orchestrator: MobileNativeOrchestrator;
  let annotations: ToolAnnotations;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    mockLogger = new MockLogger();
    orchestrator = new MobileNativeOrchestrator(mockServer, mockLogger, true);
    annotations = {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    };

    // Clear mocks
    mockLogger.reset();
  });

  describe('Tool Metadata', () => {
    it('should have correct tool metadata properties', () => {
      expect(orchestrator.toolMetadata.toolId).toBe('sfmobile-native-project-manager');
      expect(orchestrator.toolMetadata.title).toBe('Salesforce Mobile Native Project Manager');
      expect(orchestrator.toolMetadata.description).toBe(
        'Orchestrates the end-to-end workflow for generating Salesforce native mobile apps.'
      );
      expect(orchestrator.toolMetadata.inputSchema).toBeDefined();
      expect(orchestrator.toolMetadata.outputSchema).toBeDefined();
    });

    it('should register without throwing errors', () => {
      expect(() => orchestrator.register(annotations)).not.toThrow();
    });

    it('should log registration information', () => {
      // Clear any logs from constructor (child logger creation)
      mockLogger.reset();

      orchestrator.register(annotations);

      // Should have at least one log entry for registration
      expect(mockLogger.logs.length).toBeGreaterThan(0);
      const registrationLog = mockLogger.logs.find(
        log => log.message === 'Registering MCP tool: sfmobile-native-project-manager'
      );
      expect(registrationLog).toBeDefined();
      expect(registrationLog?.level).toBe('info');
    });
  });

  describe('Workflow Orchestration', () => {
    it('should handle new workflow initiation', async () => {
      const input = {
        userInput: 'I want to create an iOS app',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await orchestrator.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.orchestrationInstructionsPrompt).toBeDefined();
      expect(typeof response.orchestrationInstructionsPrompt).toBe('string');
    });

    it('should handle workflow resumption', async () => {
      const input = {
        userInput: { projectPath: '/test/path' },
        workflowStateData: { thread_id: 'existing-thread-123' },
      };

      const result = await orchestrator.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.orchestrationInstructionsPrompt).toBeDefined();
    });

    it('should log workflow processing events', async () => {
      mockLogger.reset();

      const input = {
        userInput: 'Create an Android app',
        workflowStateData: { thread_id: 'test-456' },
      };

      await orchestrator.handleRequest(input);

      // Should have logged workflow processing events
      expect(mockLogger.logs.length).toBeGreaterThan(0);
      const processingLog = mockLogger.logs.find(
        log => log.message === 'Processing orchestrator request'
      );
      expect(processingLog).toBeDefined();
      expect(processingLog?.level).toBe('info');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Test with invalid input structure
      const invalidInput = {
        // Missing required fields
      };

      const result = await orchestrator.handleRequest(invalidInput);

      // Should not throw, but may return error response
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
});
