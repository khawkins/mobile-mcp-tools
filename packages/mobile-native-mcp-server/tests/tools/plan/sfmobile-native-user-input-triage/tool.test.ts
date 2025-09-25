/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { SFMobileNativeUserInputTriageTool } from '../../../../src/tools/plan/sfmobile-native-user-input-triage/tool.js';
import { MockLogger } from '../../../utils/MockLogger.js';

describe('SFMobileNativeUserInputTriageTool', () => {
  let tool: SFMobileNativeUserInputTriageTool;
  let mockServer: McpServer;
  let mockLogger: MockLogger;
  let annotations: ToolAnnotations;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    mockLogger = new MockLogger();
    tool = new SFMobileNativeUserInputTriageTool(mockServer, mockLogger);
    annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };

    mockLogger.reset();
  });

  describe('Tool Metadata', () => {
    it('should have correct tool metadata properties', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-user-input-triage');
      expect(tool.toolMetadata.title).toBe('User Input Triage');
      expect(tool.toolMetadata.description).toContain('Parses user requirements');
      expect(tool.toolMetadata.inputSchema).toBeDefined();
      expect(tool.toolMetadata.outputSchema).toBeDefined();
      expect(tool.toolMetadata.resultSchema).toBeDefined();
    });

    it('should register without throwing errors', () => {
      // Simple smoke test - registration should not throw
      expect(() => tool.register(annotations)).not.toThrow();
    });
  });

  describe('User Input Triage Guidance', () => {
    it('should process user input and generate guidance', async () => {
      const input = {
        userUtterance: 'I want to create an iOS app',
        workflowStateData: { thread_id: 'test-thread' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('User Input Triage');
      expect(response.promptForLLM).toContain('iOS app');
      expect(response.resultSchema).toBeDefined();

      // Verify the result schema is valid JSON
      expect(() => JSON.parse(response.resultSchema)).not.toThrow();
    });

    it('should handle structured user input', async () => {
      const structuredInput = {
        platform: 'iOS',
        appDescription: 'Contact management app',
        company: 'Acme Corp',
      };

      const input = {
        userUtterance: structuredInput,
        workflowStateData: { thread_id: 'test-thread' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('iOS');
      expect(response.promptForLLM).toContain('Contact management');
      expect(response.promptForLLM).toContain('Acme Corp');
    });

    it('should handle missing workflowStateData gracefully', async () => {
      const input = {
        userUtterance: 'test input',
        // Missing workflowStateData - should still work since it's optional
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });
  });

  describe('Guidance Content Verification', () => {
    it('should include project property extraction guidance', async () => {
      const input = {
        userUtterance: 'I need an app for managing contacts',
        workflowStateData: { thread_id: 'test-thread' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('Project Name');
      expect(response.promptForLLM).toContain('Package Name');
      expect(response.promptForLLM).toContain('Organization');
    });

    it('should include concrete examples for guidance', async () => {
      const input = {
        userUtterance: 'Example request',
        workflowStateData: { thread_id: 'test-thread' },
      };

      const result = await tool.handleRequest(input);
      const responseText = result.content[0].text as string;
      const response = JSON.parse(responseText);

      expect(response.promptForLLM).toContain('Example 1');
      expect(response.promptForLLM).toContain('Salesforce Contacts');
      expect(response.promptForLLM).toContain('Example 2');
      expect(response.promptForLLM).toContain('Acme Corp');
    });
  });
});
