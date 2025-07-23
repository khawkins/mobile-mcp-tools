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
    'Provides expert grounding to implement a Document Scanner feature in a Salesforce Lightning web component (LWC).';
  protected readonly typeDefinitionPath = 'documentScanner/documentScanner.d.ts';
  public readonly serviceName = 'Document Scanner';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages document scanning facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the document scanner API of the mobile device, within the LWC.`;
}
