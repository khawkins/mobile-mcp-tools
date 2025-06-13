import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../utils/util.js';

export abstract class BaseTool {
  protected abstract readonly name: string;
  protected abstract readonly description: string;
  protected abstract readonly typeDefinitionPath: string;
  protected abstract readonly template: string;
  protected abstract readonly toolId: string;

  constructor(
    protected readonly server: McpServer,
    protected readonly annotations: ToolAnnotations
  ) {}

  protected async handleRequest() {
    try {
      const typeDefinitions = await readTypeDefinitionFile(this.typeDefinitionPath);
      return {
        content: [
          {
            type: 'text' as const,
            text: createServiceGroundingText(this.template, typeDefinitions),
          },
        ],
      };
    } catch {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: Unable to load ${this.name} type definitions.`,
          },
        ],
      };
    }
  }

  public register(): void {
    this.server.tool(
      this.toolId,
      {
        description: this.description,
        annotations: this.annotations,
      },
      this.handleRequest.bind(this)
    );
  }
}
