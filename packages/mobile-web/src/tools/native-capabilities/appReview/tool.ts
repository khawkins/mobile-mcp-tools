/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class AppReviewTool extends BaseTool {
  readonly name = 'App Review Service';
  readonly title = 'Salesforce Mobile App Review LWC Native Capability';
  public readonly toolId = 'sfmobile-web-app-review';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC App Review Service, laying the foundation for understanding mobile app review and offering expert-level guidance for implementing the App Review feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'appReview/appReviewService.d.ts';
  public readonly serviceName = 'App Review';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages app review facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the app review API of the mobile device, within the LWC.`;
}
