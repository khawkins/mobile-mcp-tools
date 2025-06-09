import { readFile } from 'fs/promises';
import { join } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';

export function registerDocumentScannerTool(server: McpServer, annotations: McpToolAnnotations) {
  server.tool(
    'sfmobile-web-document-scanner',
    {
      description:
        'Provides expert grounding to implement a Document Scanner feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    async () => {
      const content = await readFile(
        join(process.cwd(), 'resources', 'documentScanner.d.ts'),
        'utf-8'
      );
      return {
        content: [{ type: 'text', text: content }],
      };
    }
  );
}
