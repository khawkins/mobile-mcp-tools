import { readFile } from 'fs/promises';
import { join } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';

export function registerArSpaceCaptureTool(server: McpServer, annotations: McpToolAnnotations) {
  server.tool(
    'sfmobile-web-ar-space-capture',
    {
      description:
        'Provides expert grounding to implement an AR Space Capture feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    async () => {
      const content = await readFile(
        join(process.cwd(), 'resources', 'arSpaceCapture.d.ts'),
        'utf-8'
      );
      return {
        content: [{ type: 'text', text: content }],
      };
    }
  );
}
