import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Barcode Scanner Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages barcode scanning facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the barcode scanning API
of the mobile device, within the LWC.

# Barcode Scanner Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleBarcodeScannerRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('barcodeScanner/barcodeScanner.d.ts');
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
          text: 'Error: Unable to load Barcode Scanner type definitions.',
        },
      ],
    };
  }
}

export function registerBarcodeScannerTool(
  server: McpServer,
  annotations: McpToolAnnotations
): void {
  server.tool(
    'sfmobile-web-barcode-scanner',
    {
      description:
        'Provides expert grounding to implement a Barcode Scanner feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleBarcodeScannerRequest
  );
}
