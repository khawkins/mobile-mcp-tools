import { BaseTool } from '../baseTool';

export class BiometricsTool extends BaseTool {
  protected readonly name = 'Biometrics Service';
  protected readonly toolId = 'sfmobile-web-biometrics';
  protected readonly description =
    'Provides expert grounding to implement a Biometrics feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'biometrics/biometricsService.d.ts';
  protected readonly template = `# Biometrics Service Grounding Context

The following content provides grounding information for generating a Salesforce LWC that leverages biometrics scanning facilities
on mobile devices. Specifically, this context will cover the API types and methods available to leverage the face recognition and 
the finger printing scanner of the mobile device to authorize the user, within the LWC.

# Biometrics Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
}
