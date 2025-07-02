import { type AST, Linter } from 'eslint';
import { parse, type Options as MeriyahOptions } from 'meriyah';
import { Tool } from '../../Tool';
import { LwcCodeSchema, type LwcCodeType } from '../../../schemas/lwcSchema';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import lwcGraphAnalyzerPlugin from '@salesforce/eslint-plugin-lwc-graph-analyzer';
import { ruleConfigs } from './ruleConfig';

import {
  CodeAnalysisBaseIssueType,
  CodeAnalysisIssueType,
  ExpertsCodeAnalysisIssuesSchema,
  ExpertsCodeAnalysisIssuesType,
  ExpertCodeAnalysisIssuesType,
} from '../../../schemas/analysisSchema';
const bundleAnalyzer = lwcGraphAnalyzerPlugin.processors.bundleAnalyzer;
const analysisExpertName = 'Mobile Web Offline Analysis';

const recommendedConfig = lwcGraphAnalyzerPlugin.configs.recommended;

const recommendedRules = recommendedConfig.rules || {};

const meriyahParser: Linter.Parser = {
  parseForESLint(code: string, options: MeriyahOptions): { ast: AST.Program } {
    const tokens: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const comments: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const program = parse(code, {
      ...options,
      onToken: tokens,
      onComment: comments,
    }) as NonNullable<AST.Program>;

    const ast: AST.Program = {
      ...program,
      tokens,
      comments,
    };

    return { ast };
  },
};

const parserOption: Linter.ParserOptions = {
  next: true,
  module: true,
  loc: true,
  ranges: true,
};
const pluginName = '@salesforce/lwc-graph-analyzer';

const linterConfig: Linter.Config = {
  name: `config: ${pluginName}`,
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: meriyahParser,
    parserOptions: parserOption,
  },
  rules: recommendedRules,
  plugins: {
    [pluginName]: lwcGraphAnalyzerPlugin,
  },
  processor: bundleAnalyzer,
};

export class LintTool implements Tool {
  readonly name = 'Lint Tool';
  protected readonly description =
    'Analyzes LWC components for mobile-specific issues and provides detailed recommendations for improvements. It can be leveraged to check if components are mobile-ready.';
  protected readonly toolId = 'sfmobile-web-offline-analysis';
  public readonly inputSchema = LwcCodeSchema;
  public readonly outputSchema = ExpertsCodeAnalysisIssuesSchema;
  private readonly linter = new Linter({
    configType: 'flat',
  });

  private ruleReviewers: Record<string, CodeAnalysisBaseIssueType> = ruleConfigs.reduce(
    (acc, ruleConfig) => {
      acc[ruleConfig.id] = ruleConfig.config;
      return acc;
    },
    {} as Record<string, CodeAnalysisBaseIssueType>
  );

  constructor(
    protected readonly server: McpServer,
    protected readonly annotations: ToolAnnotations
  ) {}

  public register(): void {
    this.server.registerTool(
      this.toolId,
      {
        description: this.description,
        inputSchema: this.inputSchema.shape,
        annotations: this.annotations,
      },
      async (code: LwcCodeType) => {
        const jscode = code.js.map(js => js.content).join('\n');
        const { messages } = this.linter.verifyAndFix(jscode, linterConfig, {
          fix: true,
        });
        const offlineAnalysisIssues = this.analyzeIssues(jscode, messages);
        const userAnalysis: ExpertsCodeAnalysisIssuesType = {
          analysisResults: [offlineAnalysisIssues],
          orchestrationInstructions:
            "If you have not already executed the 'sfmobile-web-offline-guidance' tool in this conversation thread: (1) Immediately call the 'sfmobile-web-offline-guidance' tool, (2) Execute all review instructions from the guidance tool's output against the user's LWC component code in the specified format, (3) Combine the review results from step 2 with this tool's analysis results, then refactor the component based on all combined review recommendations.",
        } as ExpertsCodeAnalysisIssuesType;
        return {
          content: [
            {
              type: 'text',
              text: this.createAnalysisMarkdown(code.name, userAnalysis),
            },
          ],
        };
      }
    );
  }


  private createAnalysisMarkdown(componentName: string, analysisResults: ExpertsCodeAnalysisIssuesType): string {
    let markdown = `Analysis results for the LWC component ${componentName}. Please review the analysis results and provide a detailed refactoring plan for the component. \n\n`;
    
    for (const analysis of analysisResults.analysisResults) {
      // Add section title
      markdown += `# ${analysis.expertReviewerName}\n\n`;
      
      if (analysis.issues.length === 0) {
        markdown += 'No issues found.\n\n';
      } else {
        for (const issue of analysis.issues) {
          // Add issue type as subsection
          markdown += `## ${issue.type}\n\n`;
          
          // Add issue details
          markdown += `**Description:** ${issue.description}\n\n`;
          markdown += `**Intent Analysis:** ${issue.intentAnalysis}\n\n`;
          markdown += `**Suggested Action:** ${issue.suggestedAction}\n\n`;
          
          // Add code location
          markdown += `**Location:** Line ${issue.location.startLine}:${issue.location.startColumn} - Line ${issue.location.endLine}:${issue.location.endColumn}\n\n`;
          
          // Add code snippet
          markdown += `**Code:**\n\`\`\`javascript\n${issue.code}\n\`\`\`\n\n`;
          
          // Add horizontal rule between issues
          markdown += '---\n\n';
        }
      }
     
    }
    
    // Add orchestration instructions if present
    if (analysisResults.orchestrationInstructions) {
      markdown += `${analysisResults.orchestrationInstructions}\n\n`;
      markdown += '---\n\n';
    }
    
    return markdown.trim();
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
          code: code
            .split('\n')
            .slice(line - 1, endLine)
            .join('\n'),
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
      expertReviewerName: analysisExpertName,
      issues: issues,
    };
  }
}
