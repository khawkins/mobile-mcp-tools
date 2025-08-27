/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class ArSpaceCaptureTool extends BaseTool {
  readonly name = 'AR Space Capture';
  readonly title = 'Salesforce Mobile AR Space Capture LWC Native Capability';
  public readonly toolId = 'sfmobile-web-ar-space-capture';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC AR Space Capture, laying the foundation for understanding mobile AR space capture and offering expert-level guidance for implementing the AR Space Capture feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'arSpaceCapture/arSpaceCapture.d.ts';
  public readonly serviceName = 'AR Space Capture';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages AR Space Capture facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the AR Space Capture API of the mobile device, within the LWC.`;
}
