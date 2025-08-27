/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class GeofencingTool extends BaseTool {
  readonly name = 'Geofencing Service';
  readonly title = 'Salesforce Mobile Geofencing Service LWC Native Capability';
  public readonly toolId = 'sfmobile-web-geofencing';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC Geofencing Service, laying the foundation for understanding mobile geofencing and offering expert-level guidance for implementing the Geofencing feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'geofencing/geofencingService.d.ts';
  public readonly serviceName = 'Geofencing';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages geofencing facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the geofencing API of the mobile device, within the LWC.`;
}
