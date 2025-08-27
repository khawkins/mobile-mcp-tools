/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class NfcTool extends BaseTool {
  readonly name = 'NFC Service';
  readonly title = 'Salesforce Mobile NFC Service LWC Native Capability';
  public readonly toolId = 'sfmobile-web-nfc';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC NFC Service, laying the foundation for understanding mobile NFC and offering expert-level guidance for implementing the NFC feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'nfc/nfcService.d.ts';
  public readonly serviceName = 'NFC';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages NFC facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the NFC API of the mobile device, within the LWC.`;
}
