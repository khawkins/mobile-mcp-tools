import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Contacts Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages contacts facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the contacts
API of the mobile device, within the LWC.

# Contacts Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleContactsRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('resources/contactsService.d.ts');
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
          text: 'Error: Unable to load Contacts type definitions.',
        },
      ],
    };
  }
}

export function registerContactsTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-contacts',
    {
      description:
        'Provides expert grounding to implement a Contacts feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleContactsRequest
  );
}
