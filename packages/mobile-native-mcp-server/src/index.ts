#!/usr/bin/env node

/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SfmobileNativeTemplateDiscoveryTool } from './tools/plan/sfmobile-native-template-discovery/tool.js';
import { UtilsXcodeAddFilesTool } from './tools/utils/utils-xcode-add-files/tool.js';
import { SfmobileNativeDeploymentTool } from './tools/run/sfmobile-native-deployment/tool.js';
import { SfmobileNativeBuildTool } from './tools/plan/sfmobile-native-build/tool.js';
import { SfmobileNativeProjectGenerationTool } from './tools/plan/sfmobile-native-project-generation/tool.js';

import packageJson from '../package.json' with { type: 'json' };
const version = packageJson.version;
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';



const server = new McpServer({
  name: 'sfdc-mobile-native-mcp-server',
  version,
});

// Define annotations for read-only tools
const readOnlyAnnotations: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

// Tools will be added here when implemented
const tools = [
  new SfmobileNativeTemplateDiscoveryTool(),
  new SfmobileNativeProjectGenerationTool(),
  new SfmobileNativeBuildTool(),
  new SfmobileNativeDeploymentTool(),
  new UtilsXcodeAddFilesTool(),
];

// Register all tools with appropriate annotations
tools.forEach(tool => tool.register(server, readOnlyAnnotations));

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
