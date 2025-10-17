/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SFMobileNativeCompletionTool } from '../../../../src/tools/workflow/sfmobile-native-completion/tool.js';
import { MockLogger } from '../../../utils/MockLogger.js';
import { FinishWorkflowInput } from '../../../../src/tools/workflow/sfmobile-native-completion/metadata.js';

describe('SFMobileNativeCompletionTool', () => {
  let tool: SFMobileNativeCompletionTool;
  let mockServer: McpServer;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    mockLogger = new MockLogger();
    tool = new SFMobileNativeCompletionTool(mockServer, mockLogger);
  });

  describe('Tool Metadata', () => {
    it('should have correct tool properties', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-completion');
      expect(tool.toolMetadata.title).toBe('Salesforce Mobile Native App - Workflow Completion');
      expect(tool.toolMetadata.description).toBe(
        'Guides LLM through the process of building a Salesforce mobile app with target platform'
      );
    });

    it('should have input schema with required projectPath field', () => {
      const schema = tool.toolMetadata.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.shape).toBeDefined();
      expect(schema.shape.projectPath).toBeDefined();
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
    it('should generate workflow completion guidance', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/test/projects/MyApp',
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
      expect(textContent.promptForLLM).toContain('closes out the workflow');
      expect(textContent.promptForLLM).toContain('completed successfully');
    });

    it('should include project path in guidance', async () => {
      const projectPath = '/Users/test/projects/MyMobileApp';
      const input: FinishWorkflowInput = {
        projectPath,
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain(projectPath);
    });

    it('should thank the user', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Thank the user');
    });
  });

  describe('handleRequest() - Project Path Handling', () => {
    it('should handle absolute paths', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/developer/workspace/MyApp',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('/Users/developer/workspace/MyApp');
    });

    it('should handle relative paths', async () => {
      const input: FinishWorkflowInput = {
        projectPath: './projects/MyApp',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('./projects/MyApp');
    });

    it('should handle paths with spaces', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/test/My Project Folder/My App',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('/Users/test/My Project Folder/My App');
    });

    it('should handle Windows-style paths', async () => {
      const input: FinishWorkflowInput = {
        projectPath: 'C:\\Users\\developer\\projects\\MyApp',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('C:\\Users\\developer\\projects\\MyApp');
    });

    it('should handle paths with special characters', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/test/projects/My-App_v2.0',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('/Users/test/projects/My-App_v2.0');
    });

    it('should handle very long paths', async () => {
      const longPath =
        '/Users/developer/workspace/very/long/nested/directory/structure/with/many/levels/MyApp';

      const input: FinishWorkflowInput = {
        projectPath: longPath,
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain(longPath);
    });
  });

  describe('handleRequest() - Workflow State Data', () => {
    it('should include workflow state data in output', async () => {
      const workflowStateData = {
        thread_id: 'test-thread-456',
      };

      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData,
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain(workflowStateData.thread_id);
    });

    it('should preserve workflow state data for orchestrator', async () => {
      const workflowStateData = {
        thread_id: 'completion-test-789',
      };

      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData,
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('completion-test-789');
    });
  });

  describe('handleRequest() - Return Type', () => {
    it('should return CallToolResult with correct structure', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
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
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.structuredContent).toBeDefined();
    });

    it('should have promptForLLM in structured content', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
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
    it('should handle iOS project completion', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/developer/MobileApps/ContactListApp-iOS',
        workflowStateData: {
          thread_id: 'ios-completion-001',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result).toBeDefined();
      const textContent = JSON.parse(result.content[0].text as string);

      expect(textContent.promptForLLM).toContain('completed successfully');
      expect(textContent.promptForLLM).toContain('/Users/developer/MobileApps/ContactListApp-iOS');
    });

    it('should handle Android project completion', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/home/developer/android-projects/ContactListApp',
        workflowStateData: {
          thread_id: 'android-completion-002',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('completed successfully');
      expect(textContent.promptForLLM).toContain('/home/developer/android-projects/ContactListApp');
    });

    it('should handle project in user home directory', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '~/projects/MyMobileApp',
        workflowStateData: {
          thread_id: 'home-dir-completion-003',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('~/projects/MyMobileApp');
    });

    it('should handle project in workspace root', async () => {
      const input: FinishWorkflowInput = {
        projectPath: './MyApp',
        workflowStateData: {
          thread_id: 'workspace-completion-004',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('./MyApp');
    });
  });

  describe('handleRequest() - Post-Invocation Instructions', () => {
    it('should include post-invocation instructions', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Post-Tool-Invocation Instructions');
    });

    it('should instruct to format results', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
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
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
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

  describe('handleRequest() - Guidance Content', () => {
    it('should instruct to inform user of successful completion', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('closes out the workflow');
      expect(textContent.promptForLLM).toContain('Let the user know');
      expect(textContent.promptForLLM).toContain('completed successfully');
    });

    it('should instruct to provide project location', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('find their project directory');
    });

    it('should instruct to thank the user', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('Thank the user');
      expect(textContent.promptForLLM).toContain('participating in the workflow');
    });
  });

  describe('handleRequest() - Edge Cases', () => {
    it('should handle empty project path', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      expect(result).toBeDefined();
      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toBeDefined();
    });

    it('should handle path with unicode characters', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/test/项目/MyApp',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('/Users/test/项目/MyApp');
    });

    it('should handle path with emoji', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/Users/test/projects/MyApp-🚀',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('/Users/test/projects/MyApp-🚀');
    });

    it('should handle network paths', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '//network-server/shared/projects/MyApp',
        workflowStateData: {
          thread_id: 'test-thread-123',
        },
      };

      const result = await tool.handleRequest(input);

      const textContent = JSON.parse(result.content[0].text as string);
      expect(textContent.promptForLLM).toContain('//network-server/shared/projects/MyApp');
    });
  });

  describe('Integration Tests', () => {
    it('should work with MockLogger', async () => {
      const input: FinishWorkflowInput = {
        projectPath: '/path/to/project',
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
      const toolWithoutLogger = new SFMobileNativeCompletionTool(mockServer);
      expect(toolWithoutLogger).toBeDefined();
      expect(toolWithoutLogger.toolMetadata.toolId).toBe('sfmobile-native-completion');
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct tool metadata', () => {
      expect(tool).toBeDefined();
      expect(tool.toolMetadata).toBeDefined();
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-completion');
    });

    it('should accept server and logger parameters', () => {
      const customLogger = new MockLogger();
      const customTool = new SFMobileNativeCompletionTool(mockServer, customLogger);

      expect(customTool).toBeDefined();
      expect(customTool['logger']).toBe(customLogger);
    });

    it('should create default logger when none provided', () => {
      const toolWithoutLogger = new SFMobileNativeCompletionTool(mockServer);

      expect(toolWithoutLogger).toBeDefined();
      expect(toolWithoutLogger['logger']).toBeDefined();
    });
  });
});
