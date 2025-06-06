import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'sfdc-mobile-web-contacts',
  description:
    'The sfdc-mobile-web-contacts MCP server provides a tool that enables developers to create Lightning web components (LWCs) with contacts integration capabilities.',
});

server.tool(
  'sfmobile-web-contacts',
  {
    description:
      'Provides expert grounding to implement contacts integration in a Salesforce Lightning web component (LWC).',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_, _extra) => {
    const content = await readFile(join(process.cwd(), 'resources', 'contacts.d.ts'), 'utf-8');
    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

export default server;
