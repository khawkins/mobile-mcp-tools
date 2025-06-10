import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Biometrics Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages biometrics scanning facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the face recognition and 
the finger printing scanner of the mobile device to authorize the user, within the LWC.

# Biometrics Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleBiometricsRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('resources/biometricsService.d.ts');
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
          text: 'Error: Unable to load Biometrics type definitions.',
        },
      ],
    };
  }
}

export function registerBiometricsTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-biometrics',
    {
      description:
        'Provides expert grounding to implement a Biometrics feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleBiometricsRequest
  );
}
