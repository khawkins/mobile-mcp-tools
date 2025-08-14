/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class DocumentScannerTool extends BaseTool {
  readonly name = 'Document Scanner';
  readonly title = 'Salesforce Mobile Document Scanner LWC Native Capability';
  public readonly toolId = 'sfmobile-web-document-scanner';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC Document Scanner, laying the foundation for understanding mobile document scanner and offering expert-level guidance for implementing the Document Scanner feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'documentScanner/documentScanner.d.ts';
  public readonly serviceName = 'Document Scanner';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages document scanning facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the document scanner API of the mobile device, within the LWC.`;
}
