/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SFMobileNativeInputExtractionTool } from '../../../../src/tools/plan/sfmobile-native-input-extraction/tool.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('SFMobileNativeInputExtractionTool', () => {
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
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-input-extraction');
      expect(tool.toolMetadata.title).toBe('Input Extraction');
      expect(tool.toolMetadata.description).toBe(
        'Parses user input and extracts structured project properties'
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
        userUtterance: 'Create an iOS app',
        propertiesToExtract: [{ propertyName: 'platform', description: 'Target platform' }],
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept workflow state data', () => {
      const validInput = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-456' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept complex user utterance types', () => {
      const validInput = {
        userUtterance: { text: 'complex object', nested: { value: 123 } },
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-789' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept empty properties array', () => {
      const validInput = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept multiple properties to extract', () => {
      const validInput = {
        userUtterance: 'Create iOS app MyApp with package com.test.app',
        propertiesToExtract: [
          { propertyName: 'platform', description: 'Target platform' },
          { propertyName: 'projectName', description: 'Project name' },
          { propertyName: 'packageName', description: 'Package identifier' },
        ],
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject input missing userUtterance', () => {
      const invalidInput = {
        propertiesToExtract: [],
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject input missing propertiesToExtract', () => {
      const invalidInput = {
        userUtterance: 'test',
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject input missing workflowStateData', () => {
      const invalidInput = {
        userUtterance: 'test',
        propertiesToExtract: [],
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject property without propertyName', () => {
      const invalidInput = {
        userUtterance: 'test',
        propertiesToExtract: [{ description: 'Missing property name' }],
        workflowStateData: { thread_id: 'test-123' },
      };
      const result = tool.toolMetadata.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject property without description', () => {
      const invalidInput = {
        userUtterance: 'test',
        propertiesToExtract: [{ propertyName: 'test' }],
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
    it('should validate result with extractedProperties (array format)', () => {
      const validResult = {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'projectName', propertyValue: 'MyApp' },
        ],
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate result with empty extractedProperties array', () => {
      const validResult = {
        extractedProperties: [],
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate result with null property values', () => {
      const validResult = {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: null },
          { propertyName: 'projectName', propertyValue: 'MyApp' },
        ],
      };
      const result = tool.toolMetadata.resultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should reject result missing extractedProperties', () => {
      const invalidResult = {
        somethingElse: {},
      };
      const result = tool.toolMetadata.resultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject result with wrong extractedProperties format', () => {
      const invalidResult = {
        extractedProperties: {
          platform: 'iOS',
          projectName: 'MyApp',
        },
      };
      const result = tool.toolMetadata.resultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });

  describe('Extraction Guidance Generation', () => {
    it('should generate guidance with user utterance', async () => {
      const input = {
        userUtterance: 'Create an iOS app called MyApp',
        propertiesToExtract: [{ propertyName: 'platform', description: 'Target platform' }],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('Create an iOS app called MyApp');
    });

    it('should include ROLE section', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# ROLE');
      expect(response.promptForLLM).toContain('highly accurate and precise data extraction tool');
    });

    it('should include TASK section', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# TASK');
      expect(response.promptForLLM).toContain('analyze a user utterance');
      expect(response.promptForLLM).toContain('extract values for a given list of properties');
    });

    it('should include USER UTTERANCE TO ANALYZE', async () => {
      const input = {
        userUtterance: 'Create Android app TestApp',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('## USER UTTERANCE TO ANALYZE');
      expect(response.promptForLLM).toContain('Create Android app TestApp');
    });

    it('should include PROPERTIES TO EXTRACT section', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [
          { propertyName: 'platform', description: 'Target platform (iOS or Android)' },
          { propertyName: 'projectName', description: 'Name of the project' },
        ],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('## PROPERTIES TO EXTRACT');
      expect(response.promptForLLM).toContain('platform');
      expect(response.promptForLLM).toContain('Target platform (iOS or Android)');
      expect(response.promptForLLM).toContain('projectName');
      expect(response.promptForLLM).toContain('Name of the project');
    });

    it('should include INSTRUCTIONS section', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('# INSTRUCTIONS');
      expect(response.promptForLLM).toContain('Carefully read');
      expect(response.promptForLLM).toContain('search the text for');
      // Check for the backtick-formatted null value
      expect(response.promptForLLM).toMatch(/use `null` as the/i);
    });

    it('should serialize properties as JSON', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [
          { propertyName: 'platform', description: 'Target platform' },
          { propertyName: 'projectName', description: 'Project name' },
        ],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      // Should contain valid JSON representation of properties
      const jsonMatch = response.promptForLLM.match(/```json\n([\s\S]*?)```/);
      expect(jsonMatch).toBeTruthy();

      const parsedProperties = JSON.parse(jsonMatch[1]);
      expect(Array.isArray(parsedProperties)).toBe(true);
      expect(parsedProperties).toHaveLength(2);
      expect(parsedProperties[0]).toEqual({
        propertyName: 'platform',
        description: 'Target platform',
      });
    });

    it('should handle empty properties array', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toBeDefined();
      expect(response.promptForLLM).toContain('[]');
    });

    it('should handle complex user utterance object', async () => {
      const input = {
        userUtterance: {
          text: 'Create app',
          metadata: { source: 'test' },
          nested: { value: 123 },
        },
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain(JSON.stringify(input.userUtterance));
    });
  });

  describe('Error Handling', () => {
    it('should return error response on exception', async () => {
      // Create a tool that will throw an error
      const errorTool = new SFMobileNativeInputExtractionTool(mockServer);

      // Override the private method to throw
      errorTool['generateInputExtractionGuidance'] = () => {
        throw new Error('Test error');
      };

      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await errorTool.handleRequest(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error: Test error');
    });

    it('should handle non-Error exceptions', async () => {
      const errorTool = new SFMobileNativeInputExtractionTool(mockServer);

      errorTool['generateInputExtractionGuidance'] = () => {
        throw 'string error';
      };

      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await errorTool.handleRequest(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown error occurred');
    });
  });

  describe('Workflow Integration', () => {
    it('should include workflowStateData in response', async () => {
      const input = {
        userUtterance: 'test',
        propertiesToExtract: [],
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
        userUtterance: 'test',
        propertiesToExtract: [],
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
      expect(parsedSchema.properties).toHaveProperty('extractedProperties');
    });
  });

  describe('Real World Scenarios', () => {
    it('should generate guidance for mobile workflow properties', async () => {
      const input = {
        userUtterance: 'Create MyApp for iOS with package com.example.myapp',
        propertiesToExtract: [
          {
            propertyName: 'platform',
            description: 'Target mobile platform for the mobile app (iOS or Android)',
          },
          {
            propertyName: 'projectName',
            description: 'The name of the mobile app project',
          },
          {
            propertyName: 'packageName',
            description:
              'The package identifier of the mobile app, for example com.company.appname',
          },
        ],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('platform');
      expect(response.promptForLLM).toContain('projectName');
      expect(response.promptForLLM).toContain('packageName');
      expect(response.promptForLLM).toContain('iOS or Android');
      expect(response.promptForLLM).toContain('com.company.appname');
    });

    it('should handle Salesforce-specific property extraction', async () => {
      const input = {
        userUtterance:
          'Setup with client ID abc123, callback testapp://oauth, host login.salesforce.com',
        propertiesToExtract: [
          {
            propertyName: 'connectedAppClientId',
            description: 'The Salesforce Connected App Consumer Key',
          },
          {
            propertyName: 'connectedAppCallbackUri',
            description: 'The Salesforce Connected App Callback URL',
          },
          {
            propertyName: 'loginHost',
            description: 'The Salesforce login host for the mobile app',
          },
        ],
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('connectedAppClientId');
      expect(response.promptForLLM).toContain('connectedAppCallbackUri');
      expect(response.promptForLLM).toContain('loginHost');
    });
  });
});
