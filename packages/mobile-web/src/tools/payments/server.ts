import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'sfdc-mobile-web-payments',
  description:
    'The sfdc-mobile-web-payments MCP server provides a tool that enables developers to create Lightning web components (LWCs) with payment processing capabilities.',
});

server.tool(
  'sfmobile-web-payments',
  {
    description:
      'Provides expert grounding to implement payment processing in a Salesforce Lightning web component (LWC).',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_, _extra) => {
    const content = await readFile(join(process.cwd(), 'resources', 'payments.d.ts'), 'utf-8');
    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

export default server;
