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
        outputSchema: this.outputSchema.shape,
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
              text: `Analysis results for the LWC component ${code.name}`,
            },
          ],
          structuredContent: userAnalysis,
        };
      }
    );
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
