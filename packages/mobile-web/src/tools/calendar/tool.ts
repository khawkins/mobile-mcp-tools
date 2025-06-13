import { BaseTool } from '../baseTool';

export class CalendarTool extends BaseTool {
  protected readonly name = 'Calendar Service';
  protected readonly toolId = 'sfmobile-web-calendar';
  protected readonly description =
    'Provides expert grounding to implement a Calendar feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'calendar/calendarService.d.ts';
  protected readonly template = `# Calendar Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages calendar facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the calendar
API of the mobile device, within the LWC.

# Calendar Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
