/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AbstractPrompt } from '../base/abstractPrompt.js';
import { PLATFORM_ENUM } from '../../common/schemas.js';
import {
  MOBILE_APP_PROJECT_PROMPT_NAME,
  MOBILE_APP_PROJECT_PROMPT_DESCRIPTION,
  generateMobileAppProjectPrompt,
  type MobileAppProjectPromptArguments,
} from './metadata.js';

/**
 * MCP Prompt for launching the Magen mobile app generation workflow
 */
export class MobileAppProjectPrompt extends AbstractPrompt {
  constructor(server: McpServer) {
    super(server);
  }

  /**
   * Register the mobile_app_project prompt with the MCP server
   */
  public register(): void {
    this.server.prompt(
      MOBILE_APP_PROJECT_PROMPT_NAME,
      MOBILE_APP_PROJECT_PROMPT_DESCRIPTION,
      {
        platform: PLATFORM_ENUM,
      },
      async (args: MobileAppProjectPromptArguments) => {
        return generateMobileAppProjectPrompt(args);
      }
    );
  }
}
