import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Location Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages location facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the location
API of the mobile device, within the LWC.

# Location Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleLocationRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('location/locationService.d.ts');
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
          text: 'Error: Unable to load Location type definitions.',
        },
      ],
    };
  }
}

export function registerLocationTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-location',
    {
      description:
        'Provides expert grounding to implement a Location feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleLocationRequest
  );
}
