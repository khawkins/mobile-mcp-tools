import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'sfdc-mobile-web-calendar',
  description:
    'The sfdc-mobile-web-calendar MCP server provides a tool that enables developers to create Lightning web components (LWCs) with calendar integration capabilities.',
});

server.tool(
  'sfmobile-web-calendar',
  {
    description:
      'Provides expert grounding to implement calendar integration in a Salesforce Lightning web component (LWC).',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_, _extra) => {
    const content = await readFile(join(process.cwd(), 'resources', 'calendar.d.ts'), 'utf-8');
    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

export default server;
