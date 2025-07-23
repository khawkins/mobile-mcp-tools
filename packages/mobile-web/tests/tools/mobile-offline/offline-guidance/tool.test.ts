/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, vi } from 'vitest';
import { OfflineGuidanceTool } from '../../../../src/tools/mobile-offline/offline-guidance/tool.js';
import {
  createMockMcpServer,
  defaultTestAnnotations,
  createMockRequestContext,
} from '../../../utils/mcp-test-helpers.js';
import {
  ExpertsReviewInstructionsSchema,
  ExpertCodeAnalysisIssuesSchema,
  ExpertReviewInstructionsType,
} from '../../../../src/schemas/analysisSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

describe('OfflineGuidanceTool', () => {
  const tool = new OfflineGuidanceTool();

  describe('Tool Properties', () => {
    it('should have correct tool properties', () => {
      expect(tool.name).toBe('Mobile Web Offline Guidance Tool');
      expect(tool.toolId).toBe('sfmobile-web-offline-guidance');
      expect(tool.description).toContain(
        'Provides structured review instructions to detect and remediate Mobile Offline code violations in Lightning web components (LWCs) for Salesforce Mobile Apps.'
      );
      console.error(tool.description);
    });

    it('should require no input', () => {
      const inputSchemaKeys = Object.keys(tool.inputSchema.shape);
      expect(inputSchemaKeys).toHaveLength(0);
    });
  });

  describe('Tool Registration', () => {
    it('should register the tool without throwing', () => {
      const { server, registerToolSpy } = createMockMcpServer();

      expect(() => {
        tool.register(server, defaultTestAnnotations);
      }).not.toThrow();

      expect(registerToolSpy).toHaveBeenCalledWith(
        tool.toolId,
        expect.objectContaining({
          description: tool.description,
          inputSchema: tool.inputSchema.shape,
          outputSchema: tool.outputSchema.shape,
          annotations: { ...defaultTestAnnotations, title: tool.title },
        }),
        expect.any(Function)
      );
    });

    it('should register with correct tool ID', () => {
      const { server, registerToolSpy } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      expect(registerToolSpy).toHaveBeenCalledWith(
        tool.toolId,
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('Expert Review Instructions', () => {
    it('should return expert review instructions', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
      expect(typeof result.content[0].text).toBe('string');
      expect(result.structuredContent).toBeDefined();
    });

    it('should include review instructions and orchestration', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      const structuredContent = result.structuredContent as Record<string, unknown>;
      expect(structuredContent).toHaveProperty('reviewInstructions');
      expect(structuredContent).toHaveProperty('orchestrationInstructions');

      // Assert that reviewInstructions is an array with at least one element
      expect(Array.isArray(structuredContent.reviewInstructions)).toBe(true);
      expect((structuredContent.reviewInstructions as unknown[]).length).toBeGreaterThan(0);

      // Assert that orchestrationInstructions is a string
      expect(typeof structuredContent.orchestrationInstructions).toBe('string');
      expect((structuredContent.reviewInstructions as unknown[]).length).toBeGreaterThan(0);

      expect(result.structuredContent).toBeDefined();
      const parsed = ExpertsReviewInstructionsSchema.safeParse(result.structuredContent);
      expect(parsed.success).toBe(true);
    });

    it('should include conditional rendering expert instructions', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      const structuredContent = result.structuredContent as Record<string, unknown>;
      const reviewInstructions = structuredContent.reviewInstructions as unknown[];
      const expert = reviewInstructions.find(
        (expert: unknown) =>
          (expert as ExpertReviewInstructionsType).expertReviewerName ===
          'Conditional Rendering Compatibility Expert'
      );

      expect(expert).toBeDefined();

      const conditionalRenderingExpert = expert as ExpertReviewInstructionsType;

      expect(conditionalRenderingExpert.supportedFileTypes).toEqual(['HTML']);
      expect(conditionalRenderingExpert.grounding).toContain(
        'Komaci offline static analysis engine'
      );
      expect(conditionalRenderingExpert.grounding).toContain('lwc:if, lwc:elseif, lwc:else');
      expect(conditionalRenderingExpert.request).toContain('lwc:if, lwc:elseif, and lwc:else');
      expect(conditionalRenderingExpert.request).toContain('if:true/if:false');
      expect(conditionalRenderingExpert.expectedResponseFormat).toHaveProperty('schema');
      expect(conditionalRenderingExpert.expectedResponseFormat).toHaveProperty('inputValues');
      expect(conditionalRenderingExpert.expectedResponseFormat.schema).toHaveProperty('type');
      expect(conditionalRenderingExpert.expectedResponseFormat.schema.type).toBe('object');
      expect(conditionalRenderingExpert.expectedResponseFormat.schema).toHaveProperty('properties');
      expect(conditionalRenderingExpert.expectedResponseFormat.schema.properties).toHaveProperty(
        'expertReviewerName'
      );
      expect(conditionalRenderingExpert.expectedResponseFormat.schema.properties).toHaveProperty(
        'issues'
      );
      expect(conditionalRenderingExpert.expectedResponseFormat.inputValues).toEqual({
        expertReviewerName: 'Conditional Rendering Compatibility Expert',
      });
    });

    it('should include GraphQL wire expert instructions', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      const structuredContent = result.structuredContent as Record<string, unknown>;
      const reviewInstructions = structuredContent.reviewInstructions as unknown[];

      const expert = reviewInstructions.find(
        (expert: unknown) =>
          (expert as ExpertReviewInstructionsType).expertReviewerName ===
          'GraphQL Wire Configuration Expert'
      );

      expect(expert).toBeDefined();

      const graphqlWireExpert = expert as ExpertReviewInstructionsType;

      expect(graphqlWireExpert.supportedFileTypes).toEqual(['JS']);
      expect(graphqlWireExpert.grounding).toContain('Komaci offline static analysis engine');
      expect(graphqlWireExpert.grounding).toContain('GraphQL queries');
      expect(graphqlWireExpert.request).toContain('@wire decorators');
      expect(graphqlWireExpert.request).toContain('getter methods');
      expect(graphqlWireExpert.expectedResponseFormat).toHaveProperty('schema');
      expect(graphqlWireExpert.expectedResponseFormat).toHaveProperty('inputValues');
      expect(graphqlWireExpert.expectedResponseFormat.schema).toHaveProperty('type');
      expect(graphqlWireExpert.expectedResponseFormat.schema.type).toBe('object');
      expect(graphqlWireExpert.expectedResponseFormat.schema).toHaveProperty('properties');
      expect(graphqlWireExpert.expectedResponseFormat.schema.properties).toHaveProperty(
        'expertReviewerName'
      );
      expect(graphqlWireExpert.expectedResponseFormat.schema.properties).toHaveProperty('issues');
      expect(graphqlWireExpert.expectedResponseFormat.inputValues).toEqual({
        expertReviewerName: 'GraphQL Wire Configuration Expert',
      });
    });

    it('should include proper orchestration instructions', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      const structuredContent = result.structuredContent as Record<string, unknown>;
      const orchestrationInstructions = structuredContent.orchestrationInstructions;
      expect(orchestrationInstructions).toContain('sfmobile-web-offline-analysis');
      expect(orchestrationInstructions).toContain('Execute all review instructions');
      expect(orchestrationInstructions).toContain('Combine your review results');
    });

    it('should provide valid expectedResponseFormat schema structure', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      const structuredContent = result.structuredContent as Record<string, unknown>;

      const reviewInstructions = structuredContent.reviewInstructions as unknown[];

      // Verify all experts have the new expectedResponseFormat structure
      reviewInstructions.forEach((expert: unknown) => {
        const typedExpert = expert as ExpertReviewInstructionsType;
        expect(typedExpert.expectedResponseFormat).toHaveProperty('schema');
        expect(typedExpert.expectedResponseFormat).toHaveProperty('inputValues');

        // Verify schema contains the correct structure
        expect(typedExpert.expectedResponseFormat.schema).toEqual(
          zodToJsonSchema(ExpertCodeAnalysisIssuesSchema)
        );

        // Verify inputValues contains expertReviewerName
        expect(typedExpert.expectedResponseFormat.inputValues).toHaveProperty('expertReviewerName');
        expect(typeof typedExpert.expectedResponseFormat.inputValues.expertReviewerName).toBe(
          'string'
        );
        expect(typedExpert.expectedResponseFormat.inputValues.expertReviewerName).toBe(
          typedExpert.expertReviewerName
        );
      });
    });

    it('should return consistent response format', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler<Record<string, never>>();
      const context = createMockRequestContext();

      // Call multiple times to ensure consistency
      const result1 = await handler({}, context);
      const result2 = await handler({}, context);

      expect(result1.content[0].type).toBe(result2.content[0].type);
      expect(typeof result1.content[0].text).toBe(typeof result2.content[0].text);
      expect(result1.structuredContent).toBeDefined();
      expect(result2.structuredContent).toBeDefined();
    });
  });

  describe('Output Schema Validation', () => {
    it('should validate output against schema', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      const validation = tool.outputSchema.safeParse(result.structuredContent);
      expect(validation.success).toBe(true);
    });

    it('should include required properties in structured content', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();
      const result = await handler({}, context);

      expect(result.structuredContent).toHaveProperty('reviewInstructions');
      expect(result.structuredContent).toHaveProperty('orchestrationInstructions');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();

      // Mock an error in the tool execution BEFORE calling the handler
      const originalGetExpertReviewInstructions = tool['getExpertReviewInstructions'];
      tool['getExpertReviewInstructions'] = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await handler({}, context);

      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Failed to generate review instructions');
      expect(result.content[0].text).toContain('Test error');

      // Restore the original method
      tool['getExpertReviewInstructions'] = originalGetExpertReviewInstructions;
    });

    it('should handle empty input gracefully', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler<Record<string, never>>();
      const context = createMockRequestContext();

      expect(async () => {
        await handler({}, context);
      }).not.toThrow();
    });

    it('should handle undefined input gracefully', async () => {
      const { server, getToolHandler } = createMockMcpServer();

      tool.register(server, defaultTestAnnotations);

      const handler = getToolHandler();
      const context = createMockRequestContext();

      expect(async () => {
        await handler(undefined, context);
      }).not.toThrow();
    });
  });
});
