import { type AST, Linter } from 'eslint';
import { parse, type Options as MeriyahOptions } from 'meriyah';
import { Tool } from './Tool';
import { LwcCodeSchema, type LwcCodeType } from '../utils/staticReview';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import lwcGraphAnalyzerPlugin from '@salesforce/eslint-plugin-lwc-graph-analyzer';
import {
  AnalysisBaseIssue,
  AnalysisIssue,
  NO_PRIVATE_WIRE_CONFIG_RULE_ID,
  NO_WIRE_CONFIG_REFERENCES_NON_LOCAL_PROPERTY_REACTIVE_VALUE_RULE_ID,
  noPrivateWireConfigStaticReviewConfig,
  noWireConfigReferenceNonLocalPropertyStaticReviewConfig,
} from '../utils/staticReview';

const bundleAnalyzer = lwcGraphAnalyzerPlugin.processors.bundleAnalyzer;

const recommendedConfig = lwcGraphAnalyzerPlugin.configs.recommended;

const recommendedRules = recommendedConfig.rules || {};

const meriyahParser: Linter.Parser = {
  parseForESLint(code: string, options: MeriyahOptions): { ast: AST.Program } {
    const tokens: any[] = [];
    const comments: any[] = [];
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
  protected readonly toolId = 'sfmobile-web-lint';
  public readonly inputSchema = LwcCodeSchema;
  private readonly linter = new Linter({
    configType: 'flat',
  });

  private ruleReviewers: Record<string, AnalysisBaseIssue> = {
    [NO_PRIVATE_WIRE_CONFIG_RULE_ID]: noPrivateWireConfigStaticReviewConfig,
    [NO_WIRE_CONFIG_REFERENCES_NON_LOCAL_PROPERTY_REACTIVE_VALUE_RULE_ID]:
      noWireConfigReferenceNonLocalPropertyStaticReviewConfig,
  };

  constructor(
    protected readonly server: McpServer,
    protected readonly annotations: ToolAnnotations
  ) {}

  public register(): void {
    this.server.tool(
      this.toolId,
      this.description,
      this.inputSchema.shape,
      this.annotations,
      async (code: LwcCodeType) => {
        const jscode = code.js.map(js => js.content).join('\n');
        const { messages } = this.linter.verifyAndFix(jscode, linterConfig, {
          fix: true,
        });
        const issues = this.analyzeIssues(jscode, messages);
        return {
          content: [
            {
              type: 'text',
              text: this.reviewInMarkdown(issues),
            },
          ],
        };
      }
    );
  }

  private analyzeIssues(code: string, messages: Linter.LintMessage[]): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    for (const violation of messages) {
      const { ruleId, line, column, endLine, endColumn } = violation;
      const ruleReviewer = this.ruleReviewers[ruleId];
      if (ruleReviewer) {
        const issue: AnalysisIssue = {
          type: ruleReviewer.type,
          description: ruleReviewer.description,
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
    return issues;
  }

  private reviewInMarkdown(issues: AnalysisIssue[]): string {
    const review = issues
      .map(
        issue =>
          // `## ${issue.type} \n\n${issue.description} \n\n${issue.suggestedAction} \n\n${
          //   issue.code ? `\`\`\`javascript\n${issue.code}\n\`\`\`` : ''
          // } \n\n ${issue.location ? JSON.stringify(issue.location, null, 2) : ''}`
          `## ${issue.type} \n\n ${JSON.stringify(issue, null, 2)}`
      )
      .join('\n');
    return `# Linting Results \n\n ${review}`;
  }
}
