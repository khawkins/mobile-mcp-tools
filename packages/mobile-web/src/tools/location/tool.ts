import { BaseTool } from '../baseTool';

export class LocationTool extends BaseTool {
  protected readonly name = 'Location Service';
  protected readonly toolId = 'sfmobile-web-location';
  protected readonly description =
    'Provides expert grounding to implement a Location feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'location/locationService.d.ts';
  protected readonly template = `# Location Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages location facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the location
API of the mobile device, within the LWC.

# Location Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
