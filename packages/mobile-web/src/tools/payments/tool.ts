import { BaseTool } from '../baseTool';

export class PaymentsTool extends BaseTool {
  protected readonly name = 'Payments Service';
  protected readonly toolId = 'sfmobile-web-payments';
  protected readonly description =
    'Provides expert grounding to implement a Payments feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'payments/paymentsService.d.ts';
  protected readonly template = `# Payments Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages payments facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the payments
API of the mobile device, within the LWC.

## Base Capability
\`\`\`typescript
\${baseCapability}
\`\`\`

## Mobile Capabilities
\`\`\`typescript
\${mobileCapabilities}
\`\`\`

## Payments Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
