import { BaseTool } from '../baseTool';

export class ContactsTool extends BaseTool {
  readonly name = 'Contacts Service';
  protected readonly toolId = 'sfmobile-web-contacts';
  protected readonly description =
    'Provides expert grounding to implement a Contacts feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'contacts/contactsService.d.ts';
  protected readonly serviceName = 'Contacts';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages contacts facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the contacts API of the mobile device, within the LWC.`;
}
