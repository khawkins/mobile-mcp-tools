import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# AR Space Capture Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages AR Space Capture facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the AR Space Capture API
of the mobile device, within the LWC.

# AR Space Capture Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\`
`;

export async function handleArSpaceCaptureRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('resources/arSpaceCapture.d.ts');
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
          text: 'Error: Unable to load AR Space Capture type definitions.',
        },
      ],
    };
  }
}

export function registerArSpaceCaptureTool(
  server: McpServer,
  annotations: McpToolAnnotations
): void {
  server.tool(
    'sfmobile-web-ar-space-capture',
    {
      description:
        'Provides expert grounding to implement an AR Space Capture feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleArSpaceCaptureRequest
  );
}
