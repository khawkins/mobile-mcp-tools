import { readFile } from 'fs/promises';
import { join } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';

export function registerCalendarTool(server: McpServer, annotations: McpToolAnnotations) {
  server.tool(
    'sfmobile-web-calendar',
    {
      description:
        'Provides expert grounding to implement a Calendar feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    async () => {
      const content = await readFile(
        join(process.cwd(), 'resources', 'calendarService.d.ts'),
        'utf-8'
      );
      return {
        content: [{ type: 'text', text: content }],
      };
    }
  );
}
