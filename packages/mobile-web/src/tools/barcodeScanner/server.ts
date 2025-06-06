import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'sfdc-mobile-web-barcode-scanner',
  description:
    'The sfdc-mobile-web-barcode-scanner MCP server provides a tool that enables developers to create Lightning web components (LWCs) with barcode scanning capabilities.',
});

server.tool(
  'sfmobile-web-barcode-scanner',
  {
    description:
      'Provides expert grounding to implement a barcode scanner feature in a Salesforce Lightning web component (LWC).',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_, _extra) => {
    const content = await readFile(
      join(process.cwd(), 'resources', 'barcodeScanner.d.ts'),
      'utf-8'
    );
    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

export default server;
