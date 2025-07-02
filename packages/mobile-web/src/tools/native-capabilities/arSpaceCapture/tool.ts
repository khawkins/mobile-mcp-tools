import { BaseTool } from '../baseTool';

export class ArSpaceCaptureTool extends BaseTool {
  readonly name = 'AR Space Capture';
  protected readonly toolId = 'sfmobile-web-ar-space-capture';
  protected readonly description =
    'Provides expert grounding to implement an AR Space Capture feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'arSpaceCapture/arSpaceCapture.d.ts';
  protected readonly serviceName = 'AR Space Capture';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages AR Space Capture facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the AR Space Capture API of the mobile device, within the LWC.`;
}
