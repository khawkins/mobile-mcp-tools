import { BaseTool } from '../baseTool';

export class GeofencingTool extends BaseTool {
  protected readonly name = 'Geofencing Service';
  protected readonly toolId = 'sfmobile-web-geofencing';
  protected readonly description =
    'Provides expert grounding to implement a Geofencing feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'geofencing/geofencingService.d.ts';
  protected readonly serviceName = 'Geofencing';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages geofencing facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the geofencing API of the mobile device, within the LWC.`;
}
