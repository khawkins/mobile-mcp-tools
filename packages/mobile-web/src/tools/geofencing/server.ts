import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const server = new McpServer({
  name: 'Mobile Web Tools',
  description: 'A collection of mobile web tools for MCP',
});

// Geofencing Tool
server.tool(
  'geofencing',
  'Manages geofencing regions and monitoring',
  {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async (_, _extra) => {
    const content = await readFile(
      join(__dirname, '../../resources/geofencing/geofencingService.d.ts'),
      'utf-8'
    );
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }
);

export default server;
