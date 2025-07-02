/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { EmptySchema } from '../../schemas/lwcSchema';
import { Tool } from '../Tool';

export abstract class BaseTool implements Tool {
  public abstract readonly name: string;
  protected abstract readonly description: string;
  protected abstract readonly typeDefinitionPath: string;
  protected abstract readonly toolId: string;
  protected abstract readonly serviceDescription: string;
  protected abstract readonly serviceName: string;

  // Required by Tool interface
  public readonly inputSchema = EmptySchema;

  // Extract repeated path as a protected member
  protected readonly resourcesPath = resolve(__dirname, '..', '..', 'resources');

  constructor(
    protected readonly server: McpServer,
    protected readonly annotations: ToolAnnotations
  ) {}

  // Simplified - no parameter needed since it always uses this.typeDefinitionPath
  protected async readTypeDefinitionFile(): Promise<string> {
    return readFile(join(this.resourcesPath, this.typeDefinitionPath), 'utf-8');
  }

  protected async readBaseCapability(): Promise<string> {
    return readFile(join(this.resourcesPath, 'BaseCapability.d.ts'), 'utf-8');
  }

  protected async readMobileCapabilities(): Promise<string> {
    return readFile(join(this.resourcesPath, 'mobileCapabilities.d.ts'), 'utf-8');
  }

  protected createServiceGroundingText(
    typeDefinitions: string,
    baseCapability: string,
    mobileCapabilities: string
  ): string {
    return `# ${this.serviceName} Service Grounding Context

${this.serviceDescription}

## Base Capability
\`\`\`typescript
${baseCapability}
\`\`\`

## Mobile Capabilities
\`\`\`typescript
${mobileCapabilities}
\`\`\`

## ${this.serviceName} Service API
\`\`\`typescript
${typeDefinitions}
\`\`\``;
  }

  protected async handleRequest() {
    try {
      const typeDefinitions = await this.readTypeDefinitionFile();
      const baseCapability = await this.readBaseCapability();
      const mobileCapabilities = await this.readMobileCapabilities();
      return {
        content: [
          {
            type: 'text' as const,
            text: this.createServiceGroundingText(
              typeDefinitions,
              baseCapability,
              mobileCapabilities
            ),
          },
        ],
      };
    } catch {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: Unable to load ${this.name} type definitions.`,
          },
        ],
      };
    }
  }

  public register(): void {
    this.server.tool(
      this.toolId,
      this.description,
      EmptySchema.shape,
      this.annotations,
      this.handleRequest.bind(this)
    );
  }
}
