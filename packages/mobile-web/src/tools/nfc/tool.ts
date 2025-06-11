import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# NFC Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages NFC facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the NFC
API of the mobile device, within the LWC.

# NFC Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleNfcRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('nfc/nfcService.d.ts');
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
          text: 'Error: Unable to load NFC type definitions.',
        },
      ],
    };
  }
}

export function registerNfcTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-nfc',
    {
      description:
        'Provides expert grounding to implement an NFC feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleNfcRequest
  );
}
