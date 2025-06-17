import { BaseTool } from '../baseTool';

export class BarcodeScannerTool extends BaseTool {
  protected readonly name = 'Barcode Scanner';
  protected readonly toolId = 'sfmobile-web-barcode-scanner';
  protected readonly description =
    'Provides expert grounding to implement a Barcode Scanner feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'barcodeScanner/barcodeScanner.d.ts';
  protected readonly template = `# Barcode Scanner Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages barcode scanning facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the barcode scanning API
of the mobile device, within the LWC.

## Base Capability
\`\`\`typescript
\${baseCapability}
\`\`\`

## Mobile Capabilities
\`\`\`typescript
\${mobileCapabilities}
\`\`\`

## Barcode Scanner Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
