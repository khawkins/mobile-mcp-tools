/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class LocationTool extends BaseTool {
  readonly name = 'Location Service';
  readonly title = 'Salesforce Mobile Location Services LWC Native Capability';
  public readonly toolId = 'sfmobile-web-location';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC Location Service, laying the foundation for understanding mobile location and offering expert-level guidance for implementing the Location feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'location/locationService.d.ts';
  public readonly serviceName = 'Location';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages location facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the location API of the mobile device, within the LWC.`;
}
