/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import z from 'zod';
import { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { AbstractTool } from '../../../src/tools/base/abstractTool.js';
import { ToolMetadata } from '../../../src/common/metadata.js';
import { MockLogger } from '../../utils/MockLogger.js';

// Test schemas
const TestInputSchema = z.object({
  message: z.string(),
  count: z.number().optional(),
});

type TestInput = z.infer<typeof TestInputSchema>;

const TestOutputSchema = z.object({
  result: z.string(),
  success: z.boolean(),
});

// Test tool metadata
const testToolMetadata: ToolMetadata<typeof TestInputSchema, typeof TestOutputSchema> = {
  toolId: 'test-tool',
  title: 'Test Tool',
  description: 'A tool for testing',
  inputSchema: TestInputSchema,
  outputSchema: TestOutputSchema,
};

/**
 * Concrete test implementation of AbstractTool
 */
class TestTool extends AbstractTool<typeof testToolMetadata> {
  public handleRequestCallCount = 0;
  public lastInput?: TestInput;

  handleRequest: ToolCallback<typeof TestInputSchema.shape> = async (input: TestInput) => {
    this.handleRequestCallCount++;
    this.lastInput = input;

    const result: CallToolResult = {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ result: `Processed: ${input.message}`, success: true }),
        },
      ],
    };

    return result;
  };

  // Expose protected methods for testing
  public testLogError(message: string, error: Error, data?: unknown): void {
    this.logError(message, error, data);
  }

  public testCreateOperationLogger(operationName: string) {
    return this.createOperationLogger(operationName);
  }

  public testLogWorkflowEvent(event: string, data?: Record<string, unknown>): void {
    this.logWorkflowEvent(event, data);
  }
}

describe('AbstractTool', () => {
  let mockServer: McpServer;
  let mockLogger: MockLogger;
  let tool: TestTool;

  beforeEach(() => {
    mockLogger = new MockLogger();

    // Create an MCP server
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });

    tool = new TestTool(mockServer, testToolMetadata, 'TestTool', mockLogger);
  });

  describe('Constructor', () => {
    it('should initialize with server and metadata', () => {
      expect(tool['server']).toBe(mockServer);
      expect(tool.toolMetadata).toEqual(testToolMetadata);
    });

    it('should use provided logger', () => {
      expect(tool['logger']).toBe(mockLogger);
    });

    it('should create default logger when none provided', () => {
      const toolWithoutLogger = new TestTool(mockServer, testToolMetadata);
      expect(toolWithoutLogger['logger']).toBeDefined();
      expect(toolWithoutLogger['logger']).not.toBe(mockLogger);
    });

    it('should use component name from parameter when provided', () => {
      const customLogger = new MockLogger();
      const toolWithCustomName = new TestTool(
        mockServer,
        testToolMetadata,
        'CustomComponent',
        customLogger
      );
      expect(toolWithCustomName['logger']).toBe(customLogger);
    });

    it('should use constructor name when no component name provided', () => {
      const toolWithoutName = new TestTool(mockServer, testToolMetadata, undefined, mockLogger);
      expect(toolWithoutName['logger']).toBe(mockLogger);
    });
  });

  describe('register', () => {
    it('should register tool with MCP server', () => {
      const annotations: ToolAnnotations = {};

      // Registration should not throw
      expect(() => tool.register(annotations)).not.toThrow();

      // Verify tool metadata is accessible
      expect(tool.toolMetadata.toolId).toBe('test-tool');
      expect(tool.toolMetadata.description).toBe('A tool for testing');
    });

    it('should merge annotations with tool title', () => {
      const annotations: ToolAnnotations = {
        message: 'custom message',
      };

      // Registration should not throw
      expect(() => tool.register(annotations)).not.toThrow();

      // Verify tool metadata
      expect(tool.toolMetadata.toolId).toBe('test-tool');
      expect(tool.toolMetadata.title).toBe('Test Tool');
    });

    it('should log registration', () => {
      mockLogger.reset();
      const annotations: ToolAnnotations = {};

      tool.register(annotations);

      const infoLogs = mockLogger.getLogsByLevel('info');
      const registrationLog = infoLogs.find(log => log.message.includes('Registering MCP tool'));

      expect(registrationLog).toBeDefined();
      expect(registrationLog?.message).toContain('test-tool');
    });
  });

  describe('handleRequest', () => {
    it('should be called when tool is invoked', async () => {
      const input = { message: 'test', count: 5 };

      const result = await tool.handleRequest(input, {} as never);

      expect(tool.handleRequestCallCount).toBe(1);
      expect(tool.lastInput).toEqual(input);
      expect(result).toBeDefined();
    });

    it('should process tool input correctly', async () => {
      const input = { message: 'hello world' };

      const result = await tool.handleRequest(input, {} as never);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('logError', () => {
    it('should log error message and error object', () => {
      mockLogger.reset();
      const error = new Error('Test error');

      tool.testLogError('Something went wrong', error);

      const errorLogs = mockLogger.getLogsByLevel('error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Something went wrong');
      expect(errorLogs[0].data).toBe(error);
    });

    it('should log context data when provided', () => {
      mockLogger.reset();
      const error = new Error('Test error');
      const contextData = { userId: 123, action: 'test' };

      tool.testLogError('Operation failed', error, contextData);

      const errorLogs = mockLogger.getLogsByLevel('error');
      const debugLogs = mockLogger.getLogsByLevel('debug');

      expect(errorLogs).toHaveLength(1);
      expect(debugLogs).toHaveLength(1);
      expect(debugLogs[0].message).toBe('Error context data');
      expect(debugLogs[0].data).toEqual(contextData);
    });

    it('should not log debug message when no context data provided', () => {
      mockLogger.reset();
      const error = new Error('Test error');

      tool.testLogError('Error without context', error);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      expect(debugLogs).toHaveLength(0);
    });
  });

  describe('createOperationLogger', () => {
    it('should create child logger with operation context', () => {
      const operationLogger = tool.testCreateOperationLogger('validation');

      expect(operationLogger).toBeDefined();
      // The child logger should be a separate instance
      expect(operationLogger).not.toBe(tool['logger']);
    });

    it('should allow logging with operation context', () => {
      mockLogger.reset();
      const operationLogger = tool.testCreateOperationLogger('processing');

      operationLogger.info('Operation started');

      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].message).toBe('Operation started');
    });
  });

  describe('logWorkflowEvent', () => {
    it('should log workflow event with tool context', () => {
      mockLogger.reset();

      tool.testLogWorkflowEvent('Tool executed successfully');

      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].message).toBe('Tool executed successfully');
      expect(infoLogs[0].data).toMatchObject({
        workflowTool: true,
        toolId: 'test-tool',
      });
    });

    it('should include additional data in workflow event', () => {
      mockLogger.reset();
      const eventData = {
        duration: 150,
        status: 'success',
      };

      tool.testLogWorkflowEvent('Workflow step completed', eventData);

      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].data).toMatchObject({
        workflowTool: true,
        toolId: 'test-tool',
        duration: 150,
        status: 'success',
      });
    });

    it('should handle workflow event without additional data', () => {
      mockLogger.reset();

      tool.testLogWorkflowEvent('Simple workflow event');

      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].data).toMatchObject({
        workflowTool: true,
        toolId: 'test-tool',
      });
    });
  });

  describe('Integration', () => {
    it('should support full tool lifecycle', async () => {
      mockLogger.reset();

      // Register - should not throw
      expect(() => tool.register({})).not.toThrow();

      // Verify registration was logged
      const registrationLogs = mockLogger
        .getLogsByLevel('info')
        .filter(log => log.message.includes('Registering MCP tool'));
      expect(registrationLogs).toHaveLength(1);

      // Invoke
      const input = { message: 'integration test', count: 1 };
      const result = await tool.handleRequest(input, {} as never);

      expect(result).toBeDefined();
      expect(tool.handleRequestCallCount).toBe(1);

      // Log workflow event
      tool.testLogWorkflowEvent('Integration test completed', { testId: '123' });

      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs.length).toBeGreaterThan(1); // At least registration + workflow event
    });
  });
});
