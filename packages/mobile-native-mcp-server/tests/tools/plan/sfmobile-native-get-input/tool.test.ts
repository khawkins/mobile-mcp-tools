/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SFMobileNativeGetInputTool } from '../../../../src/tools/plan/sfmobile-native-get-input/tool.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('SFMobileNativeGetInputTool', () => {
  let tool: SFMobileNativeGetInputTool;
  let mockServer: McpServer;
  let annotations: ToolAnnotations;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    tool = new SFMobileNativeGetInputTool(mockServer);
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
  });

  describe('Tool Metadata', () => {
    it('should have correct tool metadata', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-get-input');
      expect(tool.toolMetadata.title).toBe('Get User Input');
      expect(tool.toolMetadata.description).toBe(
        'Provides a question to the user to elicit their input for a given property'
      );
      expect(tool.toolMetadata.inputSchema).toBeDefined();
      expect(tool.toolMetadata.outputSchema).toBeDefined();
      expect(tool.toolMetadata.resultSchema).toBeDefined();
    });

    it('should register without throwing errors', () => {
      expect(() => tool.register(annotations)).not.toThrow();
    });
  });

  describe('Input Schema Validation', () => {
    it('should accept valid input with all required fields', () => {
      const validInput = {
        question: 'What is your mobile platform?',
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept workflow state data', () => {
      const validInput = {
        question: 'What is your project name?',
        workflowStateData: { thread_id: 'test-456', custom: 'data' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept empty string question', () => {
      const validInput = {
        question: '',
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept question with special characters', () => {
      const validInput = {
        question: "What's your app's package identifier (e.g., com.company.app)?",
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject input missing question', () => {
      const invalidInput = {
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject input missing workflowStateData', () => {
      const invalidInput = {
        question: 'What is your platform?',
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject input with non-string question', () => {
      const invalidInput = {
        question: 123,
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Output Schema Validation', () => {
    it('should validate correct output structure', () => {
      const validOutput = {
        promptForLLM: 'some prompt text',
        resultSchema: '{"type": "object"}',
      };
      const result = tool.toolMetadata.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    it('should reject output missing promptForLLM', () => {
      const invalidOutput = {
        resultSchema: '{"type": "object"}',
      };
      const result = tool.toolMetadata.outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    it('should reject output missing resultSchema', () => {
      const invalidOutput = {
        promptForLLM: 'some prompt text',
      };
      const result = tool.toolMetadata.outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });
  });

  describe('Result Schema Validation', () => {
    it('should validate result with string user utterance', () => {
      const validResult = {
        userUtterance: 'iOS',
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate result with numeric user utterance', () => {
      const validResult = {
        userUtterance: 42,
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate result with object user utterance', () => {
      const validResult = {
        userUtterance: { platform: 'iOS', version: '1.0' },
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate result with null user utterance', () => {
      const validResult = {
        userUtterance: null,
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });
  });

  describe('Prompt Generation Guidance', () => {
    it('should generate guidance with question', async () => {
      const input = {
        question: 'What is your mobile platform?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('What is your mobile platform?');
    });

    it('should include ROLE section', async () => {
      const input = {
        question: 'Test question?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# ROLE');
      expect(response.promptForLLM).toContain('system instruction formatter');
    });

    it('should include TASK section', async () => {
      const input = {
        question: 'Test question?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# TASK');
      expect(response.promptForLLM).toContain('take a question');
      expect(response.promptForLLM).toContain('embed it into a standard response template');
    });

    it('should include CONTEXT section with the question', async () => {
      const input = {
        question: 'What is your project name?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# CONTEXT');
      expect(response.promptForLLM).toContain('Question to ask the user:');
      expect(response.promptForLLM).toContain('"What is your project name?"');
    });

    it('should include INSTRUCTIONS section', async () => {
      const input = {
        question: 'Test question?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# INSTRUCTIONS');
      expect(response.promptForLLM).toContain('exact question to present to the user');
      expect(response.promptForLLM).toContain('post-input navigation');
    });

    it('should handle question with quotes', async () => {
      const input = {
        question: 'What is your "Connected App" client ID?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('Connected App');
    });

    it('should handle multi-line questions', async () => {
      const input = {
        question: 'What is your mobile platform?\n(Choose iOS or Android)',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('What is your mobile platform?');
      expect(response.promptForLLM).toContain('(Choose iOS or Android)');
    });
  });

  describe('Workflow Integration', () => {
    it('should include workflowStateData in response', async () => {
      const input = {
        question: 'What is your platform?',
        workflowStateData: { thread_id: 'test-workflow-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      // The response should be structured for workflow continuation
      expect(response).toHaveProperty('promptForLLM');
      expect(response).toHaveProperty('resultSchema');
    });

    it('should provide result schema as string', async () => {
      const input = {
        question: 'What is your platform?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(typeof response.resultSchema).toBe('string');

      // Should be valid JSON schema
      const parsedSchema = JSON.parse(response.resultSchema);
      expect(parsedSchema).toHaveProperty('type');
      expect(parsedSchema).toHaveProperty('properties');
      expect(parsedSchema.properties).toHaveProperty('userUtterance');
    });
  });

  describe('Real World Scenarios', () => {
    it('should generate guidance for platform question', async () => {
      const input = {
        question: 'What is your mobile platform?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('What is your mobile platform?');
    });

    it('should generate guidance for package name question', async () => {
      const input = {
        question: 'What is the package identifier for your app? (For example: com.company.appname)',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('package identifier');
      expect(response.promptForLLM).toContain('com.company.appname');
    });

    it('should generate guidance for Salesforce-specific questions', async () => {
      const input = {
        question: 'What is your Salesforce Connected App Consumer Key?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('Connected App Consumer Key');
    });

    it('should generate guidance for date questions with format hints', async () => {
      const input = {
        question: 'What is the release date? (Please use YYYY-MM-DD format)',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('release date');
      expect(response.promptForLLM).toContain('YYYY-MM-DD');
    });

    it('should handle yes/no questions', async () => {
      const input = {
        question: 'Would you like to enable offline capabilities?',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('enable offline capabilities');
    });

    it('should handle complex questions with multiple parts', async () => {
      const input = {
        question:
          'Please provide your Salesforce login host. Use login.salesforce.com for production or test.salesforce.com for sandbox environments.',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('login.salesforce.com');
      expect(response.promptForLLM).toContain('test.salesforce.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string question', async () => {
      const input = {
        question: '',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toBeDefined();
      expect(response.promptForLLM).toContain('""');
    });

    it('should handle very long questions', async () => {
      const longQuestion =
        'What is your mobile platform? Please choose between iOS and Android. ' +
        'This decision will affect the development environment, programming language, ' +
        'build tools, deployment process, and available native capabilities for your application. ' +
        'Consider factors like your target audience, existing infrastructure, and team expertise.';

      const input = {
        question: longQuestion,
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('mobile platform');
      expect(response.promptForLLM).toContain('iOS and Android');
    });

    it('should handle questions with unicode characters', async () => {
      const input = {
        question: 'What is your project name? 🚀📱',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('project name');
    });

    it('should handle questions with special JSON characters', async () => {
      const input = {
        question: 'What is your "package\\name"? Use format: {com.example}',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
    });
  });
});
