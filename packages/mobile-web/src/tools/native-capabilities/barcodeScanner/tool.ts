/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class BarcodeScannerTool extends BaseTool {
  readonly name = 'Barcode Scanner';
  readonly title = 'Salesforce Mobile Barcode Scanner LWC Native Capability';
  public readonly toolId = 'sfmobile-web-barcode-scanner';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC Barcode Scanner, laying the foundation for understanding mobile barcode scanner and offering expert-level guidance for implementing the Barcode Scanner feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'barcodeScanner/barcodeScanner.d.ts';
  public readonly serviceName = 'Barcode Scanner';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages barcode scanning facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the barcode scanning API of the mobile device, within the LWC.`;
}
