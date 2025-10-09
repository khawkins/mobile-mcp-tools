/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SFMobileNativeFailureTool } from '../../../../src/tools/workflow/sfmobile-native-failure/tool.js';
import { MockLogger } from '../../../utils/MockLogger.js';
import { FailureWorkflowInput } from '../../../../src/tools/workflow/sfmobile-native-failure/metadata.js';

describe('SFMobileNativeFailureTool', () => {
  let tool: SFMobileNativeFailureTool;
  let mockServer: McpServer;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    mockLogger = new MockLogger();
    tool = new SFMobileNativeFailureTool(mockServer, mockLogger);
  });

  describe('Tool Metadata', () => {
    it('should have correct tool properties', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-failure');
      expect(tool.toolMetadata.title).toBe('Salesforce Mobile Native App - Workflow Failure');
      expect(tool.toolMetadata.description).toBe('Describes a failure of the workflow to the user');
    });

    it('should have input schema with required messages field', () => {
      const schema = tool.toolMetadata.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.shape).toBeDefined();
      expect(schema.shape.messages).toBeDefined();
    });

    it('should have result schema', () => {
      expect(tool.toolMetadata.resultSchema).toBeDefined();
    });

    it('should register without throwing errors', () => {
      const mockAnnotations = {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      };

      expect(() => tool.register(mockAnnotations)).not.toThrow();
    });
  });

  describe('handleRequest() - Guidance Generation', () => {
    it('should generate workflow failure guidance with single message', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Environment variable not set'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toBeDefined();
      expect(textContent.promptForLLM).toContain('ROLE');
      expect(textContent.promptForLLM).toContain('TASK');
      expect(textContent.promptForLLM).toContain('CONTEXT');
      expect(textContent.promptForLLM).toContain('INSTRUCTIONS');
    });

    it('should include failure messages in guidance', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Error message 1', 'Error message 2'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Error message 1');
      expect(textContent.promptForLLM).toContain('Error message 2');
    });

    it('should format messages as bullet list', async () => {
      const input: FailureWorkflowInput = {
        messages: ['First error', 'Second error', 'Third error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('- First error');
      expect(textContent.promptForLLM).toContain('- Second error');
      expect(textContent.promptForLLM).toContain('- Third error');
    });
  });

  describe('handleRequest() - Guidance Content', () => {
    it('should describe role correctly', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('# ROLE');
      expect(textContent.promptForLLM).toContain(
        'tool that describes a failure of the workflow to the user'
      );
    });

    it('should describe task correctly', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('# TASK');
      expect(textContent.promptForLLM).toContain('describe the failure of the workflow');
      expect(textContent.promptForLLM).toContain('supporting');
      expect(textContent.promptForLLM).toContain('evidence');
      expect(textContent.promptForLLM).toContain('specific failure messages');
    });

    it('should provide context with failure messages', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Context error message'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('# CONTEXT');
      expect(textContent.promptForLLM).toContain('list of failure messages');
    });

    it('should provide clear instructions', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Instruction error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('# INSTRUCTIONS');
      expect(textContent.promptForLLM).toContain('Do not add any extra conversation');
      expect(textContent.promptForLLM).toContain('non-recoverable');
      expect(textContent.promptForLLM).toContain('not spend time trying to fix');
    });
  });

  describe('handleRequest() - Message Formatting', () => {
    it('should format single message correctly', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Single error message'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('- Single error message');
    });

    it('should format multiple messages with correct separators', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Message 1', 'Message 2', 'Message 3'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      const prompt = textContent.promptForLLM;

      // Each message should be on its own line with a bullet
      expect(prompt).toContain('- Message 1\n- Message 2\n- Message 3');
    });

    it('should handle empty messages array', async () => {
      const input: FailureWorkflowInput = {
        messages: [],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result).toBeDefined();
      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toBeDefined();
    });

    it('should handle messages with special characters', async () => {
      const input: FailureWorkflowInput = {
        messages: [
          'Error with "quotes"',
          'Error with <HTML>',
          "Error with 'apostrophes'",
          'Error with $pecial ch@racters!',
        ],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Error with "quotes"');
      expect(textContent.promptForLLM).toContain('Error with <HTML>');
      expect(textContent.promptForLLM).toContain("Error with 'apostrophes'");
      expect(textContent.promptForLLM).toContain('Error with $pecial ch@racters!');
    });

    it('should handle messages with newlines', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Error\nwith\nnewlines'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Error\nwith\nnewlines');
    });
  });

  describe('handleRequest() - Workflow State Data', () => {
    it('should include workflow state data in output', async () => {
      const workflowStateData = {
        thread_id: 'test-thread-456',
      };

      const input: FailureWorkflowInput = {
        messages: ['Error message'],
        workflowStateData,
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain(workflowStateData.thread_id);
    });

    it('should preserve workflow state data for orchestrator', async () => {
      const workflowStateData = {
        thread_id: 'preservation-test-789',
      };

      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData,
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('preservation-test-789');
    });
  });

  describe('handleRequest() - Return Type', () => {
    it('should return CallToolResult with correct structure', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });

    it('should include both content and structured content', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.structuredContent).toBeDefined();
    });

    it('should have promptForLLM in structured content', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result.structuredContent).toHaveProperty('promptForLLM');
      expect(result.structuredContent).toHaveProperty('resultSchema');
    });
  });

  describe('handleRequest() - Real World Scenarios', () => {
    it('should handle missing environment variables scenario', async () => {
      const input: FailureWorkflowInput = {
        messages: [
          'You must set the CONNECTED_APP_CONSUMER_KEY environment variable, with your Salesforce Connected App Consumer Key associated with the mobile app. See https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5 for information on how to create a Connected App for mobile apps.',
          'You must set the CONNECTED_APP_CALLBACK_URL environment variable, with your Salesforce Connected App Callback URL associated with the mobile app. See https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5 for information on how to create a Connected App for mobile apps.',
        ],
        workflowStateData: {
          thread_id: 'env-validation-failure-001',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result).toBeDefined();
      const textContent = JSON.parse(result.content[0].text as string);

      expect(textContent.promptForLLM).toContain('CONNECTED_APP_CONSUMER_KEY');
      expect(textContent.promptForLLM).toContain('CONNECTED_APP_CALLBACK_URL');
      expect(textContent.promptForLLM).toContain(
        'https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5'
      );
    });

    it('should handle missing consumer key only', async () => {
      const input: FailureWorkflowInput = {
        messages: ['You must set the CONNECTED_APP_CONSUMER_KEY environment variable'],
        workflowStateData: {
          thread_id: 'consumer-key-failure-002',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('CONNECTED_APP_CONSUMER_KEY');
    });

    it('should handle missing callback URL only', async () => {
      const input: FailureWorkflowInput = {
        messages: ['You must set the CONNECTED_APP_CALLBACK_URL environment variable'],
        workflowStateData: {
          thread_id: 'callback-url-failure-003',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('CONNECTED_APP_CALLBACK_URL');
    });
  });

  describe('handleRequest() - Post-Invocation Instructions', () => {
    it('should include post-invocation instructions', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Post-Tool-Invocation Instructions');
    });

    it('should instruct to format results', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Format the results');
      expect(textContent.promptForLLM).toContain('JSON schema');
    });

    it('should instruct to invoke orchestrator', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('sfmobile-native-project-manager');
      expect(textContent.promptForLLM).toContain('continue the workflow');
    });
  });

  describe('handleRequest() - Error Handling Instructions', () => {
    it('should indicate failures are non-recoverable', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Fatal error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('non-recoverable');
    });

    it('should advise not to attempt fixes', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Configuration error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('not spend time trying to fix');
      expect(textContent.promptForLLM).toContain('advise them');
      expect(textContent.promptForLLM).toContain('fix the issues');
    });

    it('should instruct to describe and explain failures', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Error to describe'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('describe the failure');
      expect(textContent.promptForLLM).toContain('explain the failure');
    });
  });

  describe('handleRequest() - Edge Cases', () => {
    it('should handle very long error messages', async () => {
      const longMessage = 'Error: ' + 'x'.repeat(1000);

      const input: FailureWorkflowInput = {
        messages: [longMessage],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain(longMessage);
    });

    it('should handle many error messages', async () => {
      const manyMessages = Array.from({ length: 20 }, (_, i) => `Error message ${i + 1}`);

      const input: FailureWorkflowInput = {
        messages: manyMessages,
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      manyMessages.forEach(msg => {
        expect(textContent.promptForLLM).toContain(msg);
      });
    });

    it('should handle unicode characters', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Error 🔥', 'Ошибка', '错误'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Error 🔥');
      expect(textContent.promptForLLM).toContain('Ошибка');
      expect(textContent.promptForLLM).toContain('错误');
    });
  });

  describe('Integration Tests', () => {
    it('should work with MockLogger', async () => {
      const input: FailureWorkflowInput = {
        messages: ['Test error'],
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      mockLogger.reset();

      await tool.handleRequest(input);

      // Tool should work with logger but we're not asserting specific log calls
      // since logging is an implementation detail
      expect(mockLogger).toBeDefined();
    });

    it('should work without explicit logger', () => {
      const toolWithoutLogger = new SFMobileNativeFailureTool(mockServer);
      expect(toolWithoutLogger).toBeDefined();
      expect(toolWithoutLogger.toolMetadata.toolId).toBe('sfmobile-native-failure');
    });
  });
});
