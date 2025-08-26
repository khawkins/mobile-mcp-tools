/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Input schema for the template discovery tool
const TemplateDiscoveryInputSchema = z.object({
  platform: z.enum(['iOS', 'Android']).describe('Target mobile platform'),
  featureKeywords: z
    .array(z.string())
    .optional()
    .describe(
      'Optional feature keywords to filter templates (e.g., ["record-list", "contacts", "crud"])'
    ),
});

type TemplateDiscoveryInput = z.infer<typeof TemplateDiscoveryInputSchema>;

export interface Tool {
  readonly name: string;
  readonly description: string;
  readonly title: string;
  readonly toolId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly inputSchema: z.ZodType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly outputSchema?: z.ZodType<any>;
  register(server: McpServer, annotations: ToolAnnotations): void;
}

export class SfmobileNativeTemplateDiscoveryTool implements Tool {
  public readonly name = 'Salesforce Mobile Native Template Discovery';
  public readonly title = 'Salesforce Mobile Native Template Discovery Guide';
  public readonly toolId = 'sfmobile-native-template-discovery';
  public readonly description =
    'Guides LLM through template discovery and selection for Salesforce mobile app development';
  public readonly inputSchema = TemplateDiscoveryInputSchema;

  // Get the templates path relative to this package
  private readonly templatesPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    'templates'
  );

  public register(server: McpServer, annotations: ToolAnnotations): void {
    const enhancedAnnotations = {
      ...annotations,
      title: this.title,
    };

    server.tool(
      this.toolId,
      this.description,
      this.inputSchema.shape,
      enhancedAnnotations,
      this.handleRequest.bind(this)
    );
  }

  private async handleRequest(input: TemplateDiscoveryInput) {
    try {
      const guidance = this.generateTemplateDiscoveryGuidance(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: guidance,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  }

  private generateTemplateDiscoveryGuidance(input: TemplateDiscoveryInput): string {
    const platformLower = input.platform.toLowerCase();
    const featureFilter = input.featureKeywords
      ? ` with features: ${input.featureKeywords.join(', ')}`
      : '';

    return `# Template Discovery Guidance for ${input.platform}${featureFilter}

    You MUST follow the steps in this guide in order. Do not execute any commands that are not part of the steps in this guide.

## Step 1: Plugin Verification

First, verify the Salesforce Mobile SDK plugin is available and meets version requirements. ONLY run this command to verify the plugin is installed:

\`\`\`bash
sf plugins inspect sfdx-mobilesdk-plugin --json
\`\`\`

**Version Requirements:** The plugin must be version 13.1.0 or greater.

If the plugin is not installed, install it:

\`\`\`bash
sf plugins install sfdx-mobilesdk-plugin
\`\`\`

If the plugin is installed but the version is less than 13.1.0, upgrade it:

\`\`\`bash
sf plugins update sfdx-mobilesdk-plugin
\`\`\`

Verify the updated version meets requirements before proceeding to template discovery.

## Step 2: Template Discovery

Discover available ${input.platform} templates using:

\`\`\`bash
sf mobilesdk ${platformLower} listtemplates --templatesource=${this.templatesPath} --doc --json
\`\`\`

You MUST use the --templatesource=${this.templatesPath} flag to specify the templates source, do not use any other source.

This will show all available templates with their:
- Template ID
- Description
- Features
- Use cases

## Step 3: Template Filtering

Inspect the JSON output from the template discovery command to identify templates that best match the user's requirements and filter the templates to the most promising candidates. Prioritize templates that match multiple keywords and have comprehensive documentation.

## Step 4: Detailed Template Investigation

For each promising template, get detailed documentation:

\`\`\`bash
sf mobilesdk ${platformLower} listtemplate --templatesource=${this.templatesPath} --template=<templateId> --doc --json
\`\`\`

## Step 5: Template Selection Criteria

Choose the template that best matches:
- **Platform compatibility**: ${input.platform}
- **Feature requirements**: ${input.featureKeywords?.join(', ') || 'General mobile app needs'}
- **Use case alignment**: Record management, data display, CRUD operations
- **Complexity level**: Appropriate for the user's requirements

## Next Steps

Once you've identified the best template:
1. Note the selected template ID
2. Proceed to project generation using \`sfmobile-native-project-generation\`
3. Provide the template ID and project configuration details

## Expected Output

You should identify:
- **Selected Template ID**: The most suitable template
- **Template Features**: Key capabilities it provides
- **Rationale**: Why this template fits the user's requirements
- **Next Action**: Ready to proceed with project generation`;
  }
}
