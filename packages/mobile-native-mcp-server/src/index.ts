#!/usr/bin/env node

/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SFMobileNativeUserInputTriageTool } from './tools/plan/sfmobile-native-user-input-triage/tool.js';
import { SFMobileNativeTemplateDiscoveryTool } from './tools/plan/sfmobile-native-template-discovery/tool.js';
import { UtilsXcodeAddFilesTool } from './tools/utils/utils-xcode-add-files/tool.js';
import { SFMobileNativeDeploymentTool } from './tools/run/sfmobile-native-deployment/tool.js';
import { SFMobileNativeBuildTool } from './tools/plan/sfmobile-native-build/tool.js';
import { SFMobileNativeProjectGenerationTool } from './tools/plan/sfmobile-native-project-generation/tool.js';
import { MobileNativeOrchestrator } from './tools/workflow/sfmobile-native-project-manager/tool.js';

import packageJson from '../package.json' with { type: 'json' };
const version = packageJson.version;
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { generateMobileAppProjectPrompt } from './prompts/index.js';

const server = new McpServer({
  name: 'sfdc-mobile-native-mcp-server',
  version,
});

// Define annotations for different tool types
const readOnlyAnnotations: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const orchestratorAnnotations: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

// Initialize tools
const orchestrator = new MobileNativeOrchestrator(server);
const userInputTriageTool = new SFMobileNativeUserInputTriageTool(server);
const templateDiscoveryTool = new SFMobileNativeTemplateDiscoveryTool(server);
const projectGenerationTool = new SFMobileNativeProjectGenerationTool(server);
const buildTool = new SFMobileNativeBuildTool(server);
const deploymentTool = new SFMobileNativeDeploymentTool(server);
const xcodeAddFilesTool = new UtilsXcodeAddFilesTool(server);

// Register orchestrator with specific annotations
orchestrator.register(orchestratorAnnotations);

// Register all other tools with read-only annotations
userInputTriageTool.register(readOnlyAnnotations);
templateDiscoveryTool.register(readOnlyAnnotations);
projectGenerationTool.register(readOnlyAnnotations);
buildTool.register(readOnlyAnnotations);
deploymentTool.register(readOnlyAnnotations);
xcodeAddFilesTool.register(readOnlyAnnotations);

// Register the mobile app project prompt
server.prompt(
  'mobile_app_project',
  'Launch the Magen (Mobile App Generation) workflow to create a new mobile application project for iOS or Android',
  {
    platform: z
      .enum(['iOS', 'Android'])
      .describe('The target mobile platform for the application (iOS or Android)'),
  },
  async args => {
    return generateMobileAppProjectPrompt(args);
  }
);

export default server;

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Salesforce Mobile Native MCP Server running on stdio, from '${process.cwd()}'`);
}

main().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
