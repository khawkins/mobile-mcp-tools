import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolAnnotations } from '../../utils/util.js';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../utils/util.js';

const template = `# Calendar Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages calendar facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the calendar
API of the mobile device, within the LWC.

# Calendar Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;

export async function handleCalendarRequest() {
  try {
    const typeDefinitions = await readTypeDefinitionFile('calendar/calendarService.d.ts');
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
          text: 'Error: Unable to load Calendar Service type definitions.',
        },
      ],
    };
  }
}

export function registerCalendarTool(server: McpServer, annotations: McpToolAnnotations): void {
  server.tool(
    'sfmobile-web-calendar',
    {
      description:
        'Provides expert grounding to implement a Calendar feature in a Salesforce Lightning web component (LWC).',
      annotations,
    },
    handleCalendarRequest
  );
}
