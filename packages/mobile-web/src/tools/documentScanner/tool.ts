import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Document Scanner Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages document scanning facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the document scanner
API of the mobile device, within the LWC.

# Document Scanner Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleDocumentScannerRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('documentScanner/documentScanner.d.ts');
    return {
      content: [
        {
          type: 'text' as const,
          text: createServiceGroundingText(template, typeDefinitions),
        },
      ],
    };
  } catch {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Error: Unable to load Document Scanner type definitions.',
        },
      ],
    };
  }
}

export function registerDocumentScannerTool(
  server: McpServer,
  annotations: McpToolAnnotations
): void {
  server.tool(
    'sfmobile-web-document-scanner',
    {
      description:
        'Provides expert grounding to implement a Document Scanner feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleDocumentScannerRequest
  );
}
