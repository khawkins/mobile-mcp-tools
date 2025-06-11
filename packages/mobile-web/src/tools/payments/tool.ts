import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Payments Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages payments facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the payments
API of the mobile device, within the LWC.

# Payments Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handlePaymentsRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('payments/paymentsService.d.ts');
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
          text: 'Error: Unable to load Payments type definitions.',
        },
      ],
    };
  }
}

export function registerPaymentsTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-payments',
    {
      description:
        'Provides expert grounding to implement a Payments feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handlePaymentsRequest
  );
}
