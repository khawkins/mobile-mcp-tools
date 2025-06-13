import { BaseTool } from '../baseTool';

export class NfcTool extends BaseTool {
  protected readonly name = 'NFC Service';
  protected readonly toolId = 'sfmobile-web-nfc';
  protected readonly description =
    'Provides expert grounding to implement an NFC feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'nfc/nfcService.d.ts';
  protected readonly template = `# NFC Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages NFC facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the NFC
API of the mobile device, within the LWC.

# NFC Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
