import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Geofencing Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages geofencing facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the geofencing
API of the mobile device, within the LWC.

# Geofencing Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleGeofencingRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('geofencing/geofencingService.d.ts');
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
          text: `Error: Unable to load Geofencing type definitions.`,
        },
      ],
    };
  }
}

export function registerGeofencingTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-geofencing',
    {
      description:
        'Provides expert grounding to implement a Geofencing feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleGeofencingRequest
  );
}
