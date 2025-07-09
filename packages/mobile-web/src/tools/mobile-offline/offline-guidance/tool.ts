/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { z } from 'zod';
import { Tool } from '../../tool.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import {
  ExpertsReviewInstructionsSchema,
  ExpertsReviewInstructionsType,
  ExpertReviewInstructionsType,
} from '../../../schemas/analysisSchema.js';
import dedent from 'dedent';

const EMPTY_INPUT_SCHEMA = z.object({}).describe('No input required');

export class OfflineGuidanceTool implements Tool {
  readonly name = 'Mobile Web Offline Guidance Tool';
  readonly description =
    'Provides expert review instructions for agentic offline violation analysis. Returns structured guidance for intelligent pattern recognition and contextual analysis of LWC components for offline compatibility issues.';
  readonly toolId = 'sfmobile-web-offline-guidance';
  readonly inputSchema = EMPTY_INPUT_SCHEMA;
  readonly outputSchema = ExpertsReviewInstructionsSchema;

  public register(server: McpServer, annotations: ToolAnnotations): void {
    server.registerTool(
      this.toolId,
      {
        description: this.description,
        inputSchema: this.inputSchema.shape,
        outputSchema: this.outputSchema.shape,
        annotations: annotations,
      },
      async () => {
        try {
          const reviewInstructions = this.getExpertReviewInstructions();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(reviewInstructions),
              },
            ],
            structuredContent: reviewInstructions,
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Failed to generate review instructions: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }
    );
  }

  private getExpertReviewInstructions(): ExpertsReviewInstructionsType {
    const expertInstructions: ExpertReviewInstructionsType[] = [
      this.getConditionalRenderingExpert(),
      this.getGraphQLWireExpert(),
    ];

    return {
      expertInstructions,
      orchestrationGuidance:
        ExpertsReviewInstructionsSchema.shape.orchestrationGuidance.parse(undefined),
      expectedResponseFormat:
        ExpertsReviewInstructionsSchema.shape.expectedResponseFormat.parse(undefined),
    };
  }

  private getConditionalRenderingExpert(): ExpertReviewInstructionsType {
    return {
      expertReviewerName: 'Conditional Rendering Compatibility Expert',
      violationCategory: 'Unsupported Conditional Rendering',
      detectionGuidance: dedent`
        Scan HTML template files (.html) for modern conditional rendering directives:
        - Look for lwc:if, lwc:elseif, and lwc:else attributes
        - These directives are not supported by the Komaci offline static analysis engine
        - Note the element types and conditions being used
        - Check for complex conditional logic that might need refactoring
      `,
      analysisInstructions: dedent`
        For each modern conditional directive found:
        1. Identify the condition expression used with lwc:if or lwc:elseif
        2. Analyze the element structure and any lwc:else usage
        3. Determine if conversion to legacy if:true/if:false is straightforward
        4. Check for complex conditional chains that might need template restructuring
        5. Validate that the condition expressions are compatible with legacy syntax
        6. Report the exact line numbers and provide specific conversion guidance
      `,
      expectedResponseFormat: dedent`
        Return findings in ExpertCodeAnalysisIssuesType format with:
        - expertReviewerName: "Conditional Rendering Compatibility Expert"
        - issues: Array of CodeAnalysisIssueType objects with:
          * type: "Unsupported Conditional Rendering"
          * description: Explain why lwc:if/lwc:elseif/lwc:else are not supported offline
          * intentAnalysis: What the developer was trying to achieve with the conditional logic
          * suggestedAction: Specific instructions for converting to if:true/if:false syntax
          * code: The problematic template code snippet
          * location: Exact line and column numbers of the violation
      `,
    };
  }

  private getGraphQLWireExpert(): ExpertReviewInstructionsType {
    return {
      expertReviewerName: 'GraphQL Wire Configuration Expert',
      violationCategory: 'Inline GraphQL Queries in @wire Adapters',
      detectionGuidance: dedent`
        Scan JavaScript files (.js) for @wire decorators with inline GraphQL queries:
        - Look for @wire decorators using GraphQL wire adapters
        - Identify literal GraphQL query strings within @wire adapter configurations
        - Check for template literals or string literals containing GraphQL syntax
        - Note wire adapters that might benefit from query extraction
      `,
      analysisInstructions: dedent`
        For each @wire decorator with inline GraphQL queries:
        1. Identify the wire adapter being used (e.g., @wire(graphql, { query: '...' }))
        2. Extract the inline GraphQL query string
        3. Analyze the query complexity and reusability potential
        4. Determine appropriate getter method name for the extracted query
        5. Check for any query variables or dynamic elements
        6. Validate that extraction won't break existing functionality
        7. Report exact locations and provide refactoring guidance
      `,
      expectedResponseFormat: dedent`
        Return findings in ExpertCodeAnalysisIssuesType format with:
        - expertReviewerName: "GraphQL Wire Configuration Expert"
        - issues: Array of CodeAnalysisIssueType objects with:
          * type: "Inline GraphQL Queries in @wire Adapters"
          * description: Explain why inline GraphQL queries should be extracted from @wire configurations
          * intentAnalysis: What the developer was trying to achieve with the inline query
          * suggestedAction: Specific instructions for extracting query to a separate getter method
          * code: The problematic @wire decorator code snippet
          * location: Exact line and column numbers of the violation
      `,
    };
  }
}
