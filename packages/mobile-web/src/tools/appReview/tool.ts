import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# App Review Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages app review facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the app review API
of the mobile device, within the LWC.

# App Review Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleAppReviewRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('appReview/appReviewService.d.ts');
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
          text: 'Error: Unable to load App Review Service type definitions.',
        },
      ],
    };
  }
}

export function registerAppReviewTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-app-review',
    {
      description:
        'Provides expert grounding to implement a mobile app store review feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleAppReviewRequest
  );
}
