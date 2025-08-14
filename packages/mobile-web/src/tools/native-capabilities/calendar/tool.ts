/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseTool } from '../baseTool.js';

export class CalendarTool extends BaseTool {
  readonly name = 'Calendar Service';
  readonly title = 'Salesforce Mobile Calendar Service LWC Native Capability';
  public readonly toolId = 'sfmobile-web-calendar';
  public readonly description =
    'The MCP tool provides a comprehensive TypeScript-based API documentation for Salesforce LWC Calendar Service, laying the foundation for understanding mobile calendar and offering expert-level guidance for implementing the Calendar feature in a Lightning Web Component (LWC).';
  protected readonly typeDefinitionPath = 'calendar/calendarService.d.ts';
  public readonly serviceName = 'Calendar';
  protected readonly serviceDescription = `The following content provides grounding information for generating a Salesforce LWC that leverages calendar facilities on mobile devices. Specifically, this context will cover the API types and methods available to leverage the calendar API of the mobile device, within the LWC.`;
}
