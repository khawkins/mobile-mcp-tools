import { Tool } from './Tool';
import { LintToolInputSchema } from '../utils/util';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export class LintTool implements Tool {
  readonly name = 'Lint Tool';
  protected readonly description = 'Lint a Salesforce Lightning web component (LWC)';
  protected readonly toolId = 'sfmobile-web-lint';
  public readonly inputSchema = LintToolInputSchema;

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
      async (params: z.infer<typeof LintToolInputSchema>) => {
        console.log(params);
        return {
          content: [
            {
              type: 'text',
              text: 'Linting a Salesforce Lightning web component (LWC)',
            },
          ],
        };
      }
    );
  }
}
