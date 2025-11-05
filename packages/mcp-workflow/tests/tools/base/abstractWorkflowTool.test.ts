/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import z from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AbstractWorkflowTool } from '../../../src/tools/base/abstractWorkflowTool.js';
import {
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WORKFLOW_PROPERTY_NAMES,
  WorkflowToolMetadata,
  WorkflowStateData,
} from '../../../src/common/metadata.js';
import { MockLogger } from '../../utils/MockLogger.js';

// Test schemas - business logic schema only
const TestBusinessSchema = z.object({
  projectName: z.string(),
  description: z.string().optional(),
});

// Full input schema combines business schema with workflow base
const TestInputSchema = WORKFLOW_TOOL_BASE_INPUT_SCHEMA.extend(TestBusinessSchema.shape);

// Result schema for LLM output
const TestResultSchema = z.object({
  projectId: z.string(),
  created: z.boolean(),
});

type TestInput = z.infer<typeof TestInputSchema>;

// Test tool metadata
const testToolMetadata: WorkflowToolMetadata<
  typeof TestInputSchema,
  typeof TestResultSchema,
  typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA
> = {
  toolId: 'test-workflow-tool',
  title: 'Test Workflow Tool',
  description: 'A workflow tool for testing',
  inputSchema: TestInputSchema,
  outputSchema: MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  resultSchema: TestResultSchema,
};

/**
 * Concrete test implementation of AbstractWorkflowTool
 */
class TestWorkflowTool extends AbstractWorkflowTool<typeof testToolMetadata> {
  public handleRequestCallCount = 0;
  public lastInput?: TestInput;

  handleRequest = async (input: TestInput) => {
    this.handleRequestCallCount++;
    this.lastInput = input;

    const workflowStateData = input.workflowStateData;
    const projectName = input.projectName;

    // Use finalizeWorkflowToolOutput to create the response
    return this.finalizeWorkflowToolOutput(
      `Successfully processed project: ${projectName}`,
      workflowStateData
    );
  };

  // Expose protected method for testing
  public testFinalizeWorkflowToolOutput(
    prompt: string,
    workflowStateData: WorkflowStateData,
    resultSchema?: typeof TestResultSchema | string
  ): CallToolResult {
    return this.finalizeWorkflowToolOutput(prompt, workflowStateData, resultSchema);
  }
}

describe('AbstractWorkflowTool', () => {
  let mockServer: McpServer;
  let mockLogger: MockLogger;
  let tool: TestWorkflowTool;
  const orchestratorToolId = 'test-orchestrator';

  // Helper to extract text content from CallToolResult
  const getTextContent = (result: CallToolResult): string => {
    return (result.content[0] as { type: 'text'; text: string }).text;
  };

  beforeEach(() => {
    mockLogger = new MockLogger();

    // Create an MCP server
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });

    tool = new TestWorkflowTool(
      mockServer,
      testToolMetadata,
      orchestratorToolId,
      'TestWorkflowTool',
      mockLogger
    );
  });

  describe('Constructor', () => {
    it('should initialize with orchestratorToolId', () => {
      expect(tool['orchestratorToolId']).toBe(orchestratorToolId);
    });

    it('should inherit from AbstractTool', () => {
      expect(tool['server']).toBe(mockServer);
      expect(tool.toolMetadata).toEqual(testToolMetadata);
      expect(tool['logger']).toBe(mockLogger);
    });
  });

  describe('finalizeWorkflowToolOutput - Default Result Schema', () => {
    it('should create proper workflow tool output with post-invocation instructions', () => {
      const prompt = 'Task completed successfully';
      const workflowStateData: WorkflowStateData = {
        thread_id: 'test-thread-123',
      };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent).toHaveProperty('promptForLLM');
      expect(parsedContent).toHaveProperty('resultSchema');
    });

    it('should include original prompt in output', () => {
      const prompt = 'Project created with ID: abc-123';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent.promptForLLM).toContain(prompt);
    });

    it('should include post-invocation instructions in prompt', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent.promptForLLM).toContain('Post-Tool-Invocation Instructions');
      expect(parsedContent.promptForLLM).toContain('Format the results');
      expect(parsedContent.promptForLLM).toContain('Invoke the next tool');
    });

    it('should reference orchestrator tool ID in instructions', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent.promptForLLM).toContain(orchestratorToolId);
      expect(parsedContent.promptForLLM).toContain(`Invoke the \`${orchestratorToolId}\` tool`);
    });

    it('should include workflow state data in instructions', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = {
        thread_id: 'test-thread-456',
      };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent.promptForLLM).toContain(JSON.stringify(workflowStateData));
      expect(parsedContent.promptForLLM).toContain(WORKFLOW_PROPERTY_NAMES.workflowStateData);
    });

    it('should include userInput property name in instructions', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent.promptForLLM).toContain(WORKFLOW_PROPERTY_NAMES.userInput);
    });

    it('should use default result schema from metadata', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedContent = JSON.parse(getTextContent(result));

      // Result schema should be included
      expect(parsedContent.resultSchema).toBeDefined();
      expect(typeof parsedContent.resultSchema).toBe('string');

      // Should be a valid JSON schema
      const schemaJson = JSON.parse(parsedContent.resultSchema);
      expect(schemaJson).toHaveProperty('type');
    });
  });

  describe('finalizeWorkflowToolOutput - Custom Result Schema (String)', () => {
    it('should accept custom JSON schema as string', () => {
      const customSchemaString = JSON.stringify({
        type: 'object',
        properties: {
          customField: { type: 'string' },
          customNumber: { type: 'number' },
        },
        required: ['customField', 'customNumber'],
      });

      const prompt = 'Custom task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(
        prompt,
        workflowStateData,
        customSchemaString
      );

      const parsedContent = JSON.parse(getTextContent(result));

      // Should include custom schema in result
      expect(parsedContent.resultSchema).toBe(customSchemaString);
      const schemaJson = JSON.parse(parsedContent.resultSchema);

      // Verify it's the custom schema (contains our custom fields)
      expect(schemaJson.properties).toHaveProperty('customField');
      expect(schemaJson.properties).toHaveProperty('customNumber');
    });

    it('should handle complex JSON schema with enums', () => {
      const customSchemaString = JSON.stringify({
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed'],
          },
          timestamp: { type: 'number' },
        },
        required: ['status', 'timestamp'],
      });

      const prompt = 'Task with custom schema';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(
        prompt,
        workflowStateData,
        customSchemaString
      );

      const parsedContent = JSON.parse(getTextContent(result));
      const schemaJson = JSON.parse(parsedContent.resultSchema);

      // Verify JSON schema structure
      expect(schemaJson).toHaveProperty('type', 'object');
      expect(schemaJson).toHaveProperty('properties');
      expect(schemaJson.properties.status).toHaveProperty('enum');
      expect(schemaJson.properties.status.enum).toEqual(['pending', 'completed', 'failed']);
    });
  });

  describe('finalizeWorkflowToolOutput - Output Structure', () => {
    it('should include structuredContent in result', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent).toHaveProperty('promptForLLM');
      expect(result.structuredContent).toHaveProperty('resultSchema');
    });

    it('should have matching content and structuredContent', () => {
      const prompt = 'Task completed';
      const workflowStateData: WorkflowStateData = { thread_id: 'test-thread' };

      const result = tool.testFinalizeWorkflowToolOutput(prompt, workflowStateData);

      const parsedTextContent = JSON.parse(getTextContent(result));

      expect(parsedTextContent).toEqual(result.structuredContent);
    });
  });

  describe('handleRequest Integration', () => {
    it('should use finalizeWorkflowToolOutput in handleRequest', async () => {
      const input = {
        projectName: 'TestProject',
        description: 'A test project',
        [WORKFLOW_PROPERTY_NAMES.workflowStateData]: {
          thread_id: 'integration-test-thread',
        },
      };

      const result = await tool.handleRequest(input);

      expect(tool.handleRequestCallCount).toBe(1);
      expect(result.content).toHaveLength(1);

      const parsedContent = JSON.parse(getTextContent(result));

      expect(parsedContent.promptForLLM).toContain('Successfully processed project: TestProject');
      expect(parsedContent.promptForLLM).toContain(orchestratorToolId);
    });
  });

  describe('Multiple Orchestrators', () => {
    it('should support different orchestrator tool IDs for different instances', () => {
      const tool1 = new TestWorkflowTool(
        mockServer,
        testToolMetadata,
        'orchestrator-1',
        'Tool1',
        mockLogger
      );
      const tool2 = new TestWorkflowTool(
        mockServer,
        testToolMetadata,
        'orchestrator-2',
        'Tool2',
        mockLogger
      );

      const workflowStateData: WorkflowStateData = { thread_id: 'test' };

      const result1 = tool1.testFinalizeWorkflowToolOutput('Test 1', workflowStateData);
      const result2 = tool2.testFinalizeWorkflowToolOutput('Test 2', workflowStateData);

      const content1 = JSON.parse(getTextContent(result1));
      const content2 = JSON.parse(getTextContent(result2));

      expect(content1.promptForLLM).toContain('orchestrator-1');
      expect(content1.promptForLLM).not.toContain('orchestrator-2');

      expect(content2.promptForLLM).toContain('orchestrator-2');
      expect(content2.promptForLLM).not.toContain('orchestrator-1');
    });
  });
});
