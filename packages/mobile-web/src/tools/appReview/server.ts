import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'sfdc-mobile-web-app-review',
  description:
    'The sfdc-mobile-web-app-review MCP server provides a tool that enables developers to create Lightning web components (LWCs) with mobile app review capabilities.',
});

server.tool(
  'sfmobile-web-app-review',
  {
    description:
      'Provides expert grounding to implement a mobile app store review feature in a Salesforce Lightning web component (LWC).',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_, _extra) => {
    const content = await readFile(
      join(process.cwd(), 'resources', 'appReviewService.d.ts'),
      'utf-8'
    );
    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

export default server;
