/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { z } from 'zod';

// Schema for individual expert code analysis issues
export const ExpertCodeAnalysisIssuesSchema = z.object({
  violationCategory: z
    .string()
    .describe(
      'The category of the violation (e.g., "security", "performance", "accessibility", "best-practices")'
    ),
  severity: z
    .enum(['critical', 'high', 'medium', 'low'])
    .describe('The severity level of the issue'),
  title: z.string().describe('A concise title describing the issue'),
  description: z.string().describe('Detailed description of the issue and why it matters'),
  codeSnippet: z.string().optional().describe('Relevant code snippet that demonstrates the issue'),
  lineNumber: z.number().optional().describe('Line number where the issue occurs'),
  fileName: z.string().optional().describe('File name where the issue is located'),
  recommendation: z.string().describe('Specific recommendation for fixing the issue'),
  resources: z
    .array(z.string())
    .optional()
    .describe('Links to relevant documentation or resources'),
  impact: z.string().describe('Description of the potential impact if the issue is not addressed'),
  effort: z.enum(['low', 'medium', 'high']).describe('Estimated effort required to fix the issue'),
});

// Schema for expert instructor configuration
export const ExpertInstructorSchema = z.object({
  expertType: z
    .string()
    .describe(
      'Type of expert (e.g., "security", "performance", "accessibility", "best-practices")'
    ),
  name: z.string().describe('Name of the expert reviewer'),
  specialization: z.string().describe('Area of specialization for this expert'),
  reviewInstructions: z
    .string()
    .describe('Detailed instructions for how this expert should conduct their review'),
  checklistItems: z
    .array(z.string())
    .describe('Specific items this expert should check during review'),
  violationCategories: z
    .array(z.string())
    .describe('Categories of violations this expert focuses on'),
  priorityLevel: z
    .enum(['primary', 'secondary', 'tertiary'])
    .describe('Priority level of this expert in the review process'),
});

// Schema for orchestration guidance
export const OrchestrationGuidanceSchema = z.object({
  workflowSteps: z
    .array(z.string())
    .describe('Step-by-step workflow instructions for the MCP client'),
  coordinationInstructions: z
    .string()
    .describe('Instructions for coordinating between different experts'),
  aggregationStrategy: z
    .string()
    .describe('How to aggregate and prioritize findings from multiple experts'),
  reportingFormat: z.string().describe('Format for the final consolidated report'),
  conflictResolution: z.string().describe('How to handle conflicts between expert recommendations'),
});

// Main schema for expert review instructions
export const ExpertsReviewInstructionsSchema = z.object({
  expertInstructors: z
    .array(ExpertInstructorSchema)
    .describe(
      'Array of expert instructors, each providing specialized review guidance for their violation category'
    ),
  orchestrationGuidance: OrchestrationGuidanceSchema.describe(
    'Built-in instructions for MCP client workflow coordination'
  ),
  expectedResponseFormat: z
    .object({
      schema: z
        .literal('ExpertCodeAnalysisIssuesSchema')
        .describe('Reference to the expected response schema structure'),
      structure: z.string().describe('Description of the expected response structure'),
      validationRules: z.array(z.string()).describe('Validation rules that responses must follow'),
    })
    .describe('Complete schema structure that LLM responses must follow'),
  metadata: z
    .object({
      version: z.string().describe('Version of the review schema'),
      createdAt: z.string().describe('ISO timestamp of when the schema was created'),
      lastModified: z.string().describe('ISO timestamp of when the schema was last modified'),
      reviewScope: z
        .array(z.string())
        .describe(
          'Scope of what should be reviewed (e.g., "code quality", "security", "performance")'
        ),
    })
    .describe('Metadata about the review configuration'),
});

// Type exports for TypeScript usage
export type ExpertCodeAnalysisIssues = z.infer<typeof ExpertCodeAnalysisIssuesSchema>;
export type ExpertInstructor = z.infer<typeof ExpertInstructorSchema>;
export type OrchestrationGuidance = z.infer<typeof OrchestrationGuidanceSchema>;
export type ExpertsReviewInstructions = z.infer<typeof ExpertsReviewInstructionsSchema>;
