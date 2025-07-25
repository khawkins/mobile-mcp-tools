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
  ExpertCodeAnalysisIssuesSchema,
} from '../../../schemas/analysisSchema.js';
import dedent from 'dedent';
import { zodToJsonSchema } from 'zod-to-json-schema';

const EMPTY_INPUT_SCHEMA = z.object({}).describe('No input required');

export class OfflineGuidanceTool implements Tool {
  readonly name = 'Mobile Web Offline Guidance Tool';
  readonly title = 'Salesforce Mobile Offline LWC Expert Instruction Delivery';
  readonly description =
    'Provides structured review instructions to detect and remediate Mobile Offline code violations in Lightning web components (LWCs) for Salesforce Mobile Apps.';
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
        annotations: {
          ...annotations,
          title: this.title,
        },
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
    const reviewInstructions: ExpertReviewInstructionsType[] = [
      this.getConditionalRenderingExpert(),
      this.getGraphqlWireExpert(),
    ];

    return {
      reviewInstructions,
      orchestrationInstructions:
        ExpertsReviewInstructionsSchema.shape.orchestrationInstructions.parse(undefined),
    };
  }

  private getConditionalRenderingExpert(): ExpertReviewInstructionsType {
    const expertReviewerName = 'Conditional Rendering Compatibility Expert';
    return {
      expertReviewerName,
      supportedFileTypes: ['HTML'],
      grounding: dedent`
        The Komaci offline static analysis engine used by Salesforce Mobile App Plus and Field Service Mobile App 
        does not support modern conditional rendering directives (lwc:if, lwc:elseif, lwc:else) that were introduced 
        in newer versions of LWC. These directives must be converted to legacy conditional directives (if:true, if:false) 
        to ensure compatibility with offline data priming.
      `,
      request: dedent`
        Review the HTML template files for any usage of modern conditional rendering directives:
        
        1. Scan for lwc:if, lwc:elseif, and lwc:else attributes on any elements
        2. For each occurrence, analyze the conditional logic structure
        3. Determine the appropriate conversion strategy to if:true/if:false syntax
        4. Consider nested conditional logic and complex boolean expressions
        5. Validate that the conversion maintains the original functionality
        6. Report each violation with specific conversion guidance
        
        Focus on identifying patterns that use these modern directives and provide actionable 
        refactoring steps to convert them to legacy directive syntax.
      `,
      expectedResponseFormat: {
        schema: zodToJsonSchema(ExpertCodeAnalysisIssuesSchema),
        inputValues: {
          expertReviewerName,
        },
      },
    };
  }

  private getGraphqlWireExpert(): ExpertReviewInstructionsType {
    const expertReviewerName = 'GraphQL Wire Configuration Expert';
    return {
      expertReviewerName,
      supportedFileTypes: ['JS'],
      grounding: dedent`
        The Komaci offline static analysis engine requires GraphQL queries to be extracted from wire adapter 
        configurations into separate getter methods for proper offline data priming. Inline GraphQL query strings 
        within @wire adapter calls prevent the static analysis engine from properly understanding and optimizing 
        data dependencies for offline scenarios.
      `,
      request: dedent`
        Review the JavaScript files for @wire decorators with inline GraphQL queries:
        
        1. Identify @wire decorators that use GraphQL wire adapters
        2. Look for literal GraphQL query strings within the wire configuration objects
        3. Check for template literals or string literals containing GraphQL syntax
        4. Analyze the complexity and reusability of the inline queries
        5. Determine appropriate getter method names for extracted queries
        6. Validate that extraction won't break existing functionality
        7. Report each violation with specific refactoring guidance
        
        Focus on identifying patterns where GraphQL queries are embedded directly in wire 
        configurations and provide actionable steps to extract them to separate getter methods.
      `,
      expectedResponseFormat: {
        schema: zodToJsonSchema(ExpertCodeAnalysisIssuesSchema),
        inputValues: {
          expertReviewerName,
        },
      },
    };
  }
}
