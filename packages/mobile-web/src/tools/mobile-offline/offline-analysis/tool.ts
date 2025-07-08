/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { Linter } from 'eslint';
import { Tool } from '../../tool.js';
import { LwcCodeSchema, type LwcCodeType } from '../../../schemas/lwcSchema.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import lwcGraphAnalyzerPlugin from '@salesforce/eslint-plugin-lwc-graph-analyzer';
import { ruleConfigs } from './ruleConfig.js';

import {
  CodeAnalysisBaseIssueType,
  CodeAnalysisIssueType,
  ExpertsCodeAnalysisIssuesSchema,
  ExpertsCodeAnalysisIssuesType,
  ExpertCodeAnalysisIssuesType,
} from '../../../schemas/analysisSchema.js';

const ANALYSIS_EXPERT_NAME = 'Mobile Web Offline Analysis';
const PLUGIN_NAME = '@salesforce/lwc-graph-analyzer';
const RECOMMENDED_CONFIG = lwcGraphAnalyzerPlugin.configs.recommended;

const LINTER_CONFIG: Linter.Config = {
  name: `config: ${PLUGIN_NAME}`,
  plugins: {
    [PLUGIN_NAME]: lwcGraphAnalyzerPlugin,
  },
  ...RECOMMENDED_CONFIG,
};

export class OfflineAnalysisTool implements Tool {
  readonly name = 'Mobile Web Offline Analysis Tool';
  readonly description =
    'Analyzes LWC components for mobile-specific issues and provides detailed recommendations for improvements. It can be leveraged to check if components are mobile-ready.';
  readonly toolId = 'sfmobile-web-offline-analysis';
  readonly inputSchema = LwcCodeSchema;
  readonly outputSchema = ExpertsCodeAnalysisIssuesSchema;

  private readonly linter: Linter;
  private readonly ruleReviewers: Record<string, CodeAnalysisBaseIssueType>;

  constructor() {
    this.linter = new Linter({ configType: 'flat' });
    this.ruleReviewers = this.initializeRuleReviewers();
  }

  public register(server: McpServer, annotations: ToolAnnotations): void {
    server.registerTool(
      this.toolId,
      {
        description: this.description,
        inputSchema: this.inputSchema.shape,
        annotations: annotations,
      },
      async (code: LwcCodeType) => {
        try {
          const analysisResults = await this.analyzeCode(code);

          return {
            content: [
              {
                type: 'text',
                text: this.createAnalysisMarkdown(code.name, analysisResults),
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Failed to analyze code: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }
    );
  }

  private initializeRuleReviewers(): Record<string, CodeAnalysisBaseIssueType> {
    return ruleConfigs.reduce(
      (acc, ruleConfig) => {
        acc[ruleConfig.id] = ruleConfig.config;
        return acc;
      },
      {} as Record<string, CodeAnalysisBaseIssueType>
    );
  }

  private async analyzeCode(code: LwcCodeType): Promise<ExpertsCodeAnalysisIssuesType> {
    const jsCode = code.js.map(js => js.content).join('\n');
    const { messages } = this.linter.verifyAndFix(jsCode, LINTER_CONFIG, {
      fix: true,
    });

    const offlineAnalysisIssues = this.analyzeIssues(jsCode, messages);

    return {
      analysisResults: [offlineAnalysisIssues],
      orchestrationInstructions: this.getOrchestrationInstructions(),
    };
  }

  private getOrchestrationInstructions(): string {
    return "If you have not already executed the 'sfmobile-web-offline-guidance' tool in this conversation thread: (1) Immediately call the 'sfmobile-web-offline-guidance' tool, (2) Execute all review instructions from the guidance tool's output against the user's LWC component code in the specified format, (3) Combine the review results from step 2 with this tool's analysis results, then refactor the component based on all combined review recommendations.";
  }

  private createAnalysisMarkdown(
    componentName: string,
    analysisResults: ExpertsCodeAnalysisIssuesType
  ): string {
    const markdowns: string[] = [];
    markdowns.push(
      `Analysis results for the LWC component ${componentName} are presented below. Please review them and provide a detailed refactoring plan for the component. `
    );

    for (const analysis of analysisResults.analysisResults) {
      markdowns.push(this.formatAnalysisSection(analysis));
    }

    if (analysisResults.orchestrationInstructions) {
      markdowns.push(
        `# orchestration instructions:\n\n ${analysisResults.orchestrationInstructions}`
      );
    }

    return markdowns.join('\n\n');
  }

  private formatAnalysisSection(analysis: ExpertCodeAnalysisIssuesType): string {
    const sections: string[] = [];
    sections.push(`# ${analysis.expertReviewerName}`);

    if (analysis.issues.length === 0) {
      sections.push('No issues found.');
      return sections.join('\n\n');
    }

    for (const issue of analysis.issues) {
      sections.push(this.formatIssue(issue));
    }

    return sections.join('\n\n');
  }

  private formatIssue(issue: CodeAnalysisIssueType): string {
    const issueText: string[] = [];
    issueText.push(`## ${issue.type}`);
    issueText.push(`**Description:** ${issue.description}`);
    issueText.push(`**Intent Analysis:** ${issue.intentAnalysis}`);
    issueText.push(`**Suggested Action:** ${issue.suggestedAction}`);

    if (issue.location) {
      issueText.push(
        `**Location:** Line ${issue.location.startLine}:${issue.location.startColumn} - Line ${issue.location.endLine}:${issue.location.endColumn}`
      );
    }

    if (issue.code) {
      issueText.push(`**Code:**\n\`\`\`javascript\n${issue.code}\n\`\`\``);
    }

    issueText.push('---');
    return issueText.join('\n\n');
  }

  private analyzeIssues(
    code: string,
    messages: Linter.LintMessage[]
  ): ExpertCodeAnalysisIssuesType {
    const issues: CodeAnalysisIssueType[] = [];

    for (const violation of messages) {
      const { ruleId, line, column, endLine, endColumn } = violation;
      const ruleReviewer = this.ruleReviewers[ruleId];

      if (ruleReviewer) {
        const issue: CodeAnalysisIssueType = {
          type: ruleReviewer.type,
          description: ruleReviewer.description,
          intentAnalysis: ruleReviewer.intentAnalysis,
          suggestedAction: ruleReviewer.suggestedAction,
          code: this.extractCodeSnippet(code, line, endLine),
          location: {
            startLine: line,
            startColumn: column,
            endLine: endLine,
            endColumn: endColumn,
          },
        };
        issues.push(issue);
      }
    }

    return {
      expertReviewerName: ANALYSIS_EXPERT_NAME,
      issues: issues,
    };
  }

  private extractCodeSnippet(code: string, startLine: number, endLine: number): string {
    return code
      .split('\n')
      .slice(startLine - 1, endLine)
      .join('\n');
  }
}
