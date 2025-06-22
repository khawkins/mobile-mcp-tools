import { BaseTool } from '../baseTool';

export class AppReviewTool extends BaseTool {
  readonly name = 'App Review Service';
  protected readonly toolId = 'sfmobile-web-app-review';
  protected readonly description =
    'Provides expert grounding to implement a mobile app store review feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'appReview/appReviewService.d.ts';
  protected readonly serviceName = 'App Review';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages app review facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the app review API of the mobile device, within the LWC.`;
}
