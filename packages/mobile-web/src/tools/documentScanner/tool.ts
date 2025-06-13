import { BaseTool } from '../baseTool';

export class DocumentScannerTool extends BaseTool {
  protected readonly name = 'Document Scanner';
  protected readonly toolId = 'sfmobile-web-document-scanner';
  protected readonly description =
    'Provides expert grounding to implement a Document Scanner feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'documentScanner/documentScanner.d.ts';
  protected readonly template = `# Document Scanner Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages document scanning facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the document scanner
API of the mobile device, within the LWC.

# Document Scanner API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
