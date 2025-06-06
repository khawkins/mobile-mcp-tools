import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'sfdc-mobile-web-ar-space-capture',
  description:
    'The sfdc-mobile-web-ar-space-capture MCP server provides a tool that enables developers to create Lightning web components (LWCs) with mobile AR space capture capabilities.',
});

server.tool(
  'sfmobile-web-ar-space-capture',
  {
    description:
      'Provides expert grounding to implement a mobile AR space capture feature in a Salesforce Lightning web component (LWC).',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_, _extra) => {
    const content = await readFile(
      join(process.cwd(), 'resources', 'arSpaceCapture.d.ts'),
      'utf-8'
    );
    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

export default server;
