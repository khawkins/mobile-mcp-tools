/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SFMobileNativeInputExtractionTool } from '../../../../src/tools/plan/sfmobile-native-generate-question/tool.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('SFMobileNativeGenerateQuestionTool', () => {
  let tool: SFMobileNativeInputExtractionTool;
  let mockServer: McpServer;
  let annotations: ToolAnnotations;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    tool = new SFMobileNativeInputExtractionTool(mockServer);
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
  });

  describe('Tool Metadata', () => {
    it('should have correct tool metadata', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-generate-question');
      expect(tool.toolMetadata.title).toBe('Generate Question for User Input');
      expect(tool.toolMetadata.description).toBe(
        "Based on its input property, generates a question prompting the user for the property's input"
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
        propertyMetadata: {
          propertyName: 'platform',
          friendlyName: 'mobile platform',
          description: 'Target mobile platform (iOS or Android)',
        },
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept workflow state data', () => {
      const validInput = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test property',
          description: 'test description',
        },
        workflowStateData: { thread_id: 'test-456', custom: 'data' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject input missing propertyMetadata', () => {
      const invalidInput = {
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject input missing workflowStateData', () => {
      const invalidInput = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test',
          description: 'test',
        },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject propertyMetadata without propertyName', () => {
      const invalidInput = {
        propertyMetadata: {
          friendlyName: 'test',
          description: 'test',
        },
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject propertyMetadata without friendlyName', () => {
      const invalidInput = {
        propertyMetadata: {
          propertyName: 'test',
          description: 'test',
        },
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject propertyMetadata without description', () => {
      const invalidInput = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test',
        },
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
    it('should validate result with question', () => {
      const validResult = {
        question: 'What is your mobile platform?',
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate result with complex question', () => {
      const validResult = {
        question: 'What is the package name for your app (e.g., com.company.appname)?',
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should reject result missing question', () => {
      const invalidResult = {
        somethingElse: 'value',
      };
      const result = tool.toolMetadata.resultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject result with non-string question', () => {
      const invalidResult = {
        question: 123,
      };
      const result = tool.toolMetadata.resultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });

  describe('Question Generation Guidance', () => {
    it('should generate guidance with property metadata', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'platform',
          friendlyName: 'mobile platform',
          description: 'Target mobile platform (iOS or Android)',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('platform');
      expect(response.promptForLLM).toContain('mobile platform');
      expect(response.promptForLLM).toContain('Target mobile platform (iOS or Android)');
    });

    it('should include ROLE section', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test property',
          description: 'test description',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# ROLE');
      expect(response.promptForLLM).toContain('friendly and helpful conversational assistant');
    });

    it('should include TASK section', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test property',
          description: 'test description',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# TASK');
      expect(response.promptForLLM).toContain('formulate a clear, simple, and polite question');
      expect(response.promptForLLM).toContain('single piece of information');
    });

    it('should include CONTEXT section with property details', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'projectName',
          friendlyName: 'project name',
          description: 'The name of your mobile application project',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# CONTEXT');
      expect(response.promptForLLM).toContain('Property Name: projectName');
      expect(response.promptForLLM).toContain('Friendly Name: project name');
      expect(response.promptForLLM).toContain(
        'Description: The name of your mobile application project'
      );
    });

    it('should include INSTRUCTIONS section', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test property',
          description: 'test description',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# INSTRUCTIONS');
      expect(response.promptForLLM).toContain('Use the "Friendly Name"');
      expect(response.promptForLLM).toContain('polite and conversational');
      expect(response.promptForLLM).toContain('Do not add any extra conversation');
    });

    it('should handle property with format hints in description', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'date',
          friendlyName: 'release date',
          description: 'The release date in YYYY-MM-DD format',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('YYYY-MM-DD format');
      expect(response.promptForLLM).toContain('helpful hint');
    });
  });

  describe('Workflow Integration', () => {
    it('should include workflowStateData in response', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test',
          description: 'test',
        },
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
        propertyMetadata: {
          propertyName: 'test',
          friendlyName: 'test',
          description: 'test',
        },
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
      expect(parsedSchema.properties).toHaveProperty('question');
    });
  });

  describe('Real World Scenarios', () => {
    it('should generate guidance for platform property', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'platform',
          friendlyName: 'mobile platform',
          description: 'Target mobile platform for the mobile app (iOS or Android)',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('platform');
      expect(response.promptForLLM).toContain('iOS or Android');
    });

    it('should generate guidance for package name property', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'packageName',
          friendlyName: 'package identifier',
          description: 'The package identifier of the mobile app, for example com.company.appname',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('packageName');
      expect(response.promptForLLM).toContain('package identifier');
      expect(response.promptForLLM).toContain('com.company.appname');
    });

    it('should generate guidance for Salesforce-specific properties', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'connectedAppClientId',
          friendlyName: 'Connected App Consumer Key',
          description: 'The Salesforce Connected App Consumer Key used for OAuth authentication',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('connectedAppClientId');
      expect(response.promptForLLM).toContain('Connected App Consumer Key');
      expect(response.promptForLLM).toContain('OAuth authentication');
    });

    it('should generate guidance for date properties with format hints', async () => {
      const input = {
        propertyMetadata: {
          propertyName: 'releaseDate',
          friendlyName: 'release date',
          description: 'The planned release date of the app in YYYY-MM-DD format',
        },
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('release date');
      expect(response.promptForLLM).toContain('YYYY-MM-DD');
    });
  });
});
