#!/usr/bin/env node

/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SFMobileNativeTemplateDiscoveryTool } from './tools/plan/sfmobile-native-template-discovery/tool.js';
import { SFMobileNativeGenerateQuestionTool } from './tools/plan/sfmobile-native-generate-question/tool.js';
import { SFMobileNativeGetInputTool } from './tools/plan/sfmobile-native-get-input/tool.js';
import { SFMobileNativeInputExtractionTool } from './tools/plan/sfmobile-native-input-extraction/tool.js';
import { UtilsXcodeAddFilesTool } from './tools/utils/utils-xcode-add-files/tool.js';
import { SFMobileNativeDeploymentTool } from './tools/run/sfmobile-native-deployment/tool.js';
import { SFMobileNativeBuildTool } from './tools/plan/sfmobile-native-build/tool.js';
import { SFMobileNativeProjectGenerationTool } from './tools/plan/sfmobile-native-project-generation/tool.js';
import { MobileNativeOrchestrator } from './tools/workflow/sfmobile-native-project-manager/tool.js';
import { SFMobileNativeCompletionTool } from './tools/workflow/sfmobile-native-completion/tool.js';
import { SFMobileNativeFailureTool } from './tools/workflow/sfmobile-native-failure/tool.js';

import packageJson from '../package.json' with { type: 'json' };
const version = packageJson.version;
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

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
const generateQuestionTool = new SFMobileNativeGenerateQuestionTool(server);
const getInputTool = new SFMobileNativeGetInputTool(server);
const inputExtractionTool = new SFMobileNativeInputExtractionTool(server);
const templateDiscoveryTool = new SFMobileNativeTemplateDiscoveryTool(server);
const projectGenerationTool = new SFMobileNativeProjectGenerationTool(server);
const buildTool = new SFMobileNativeBuildTool(server);
const deploymentTool = new SFMobileNativeDeploymentTool(server);
const xcodeAddFilesTool = new UtilsXcodeAddFilesTool(server);
const completionTool = new SFMobileNativeCompletionTool(server);
const failureTool = new SFMobileNativeFailureTool(server);

// Register orchestrator with specific annotations
orchestrator.register(orchestratorAnnotations);

// Register all other tools with read-only annotations
generateQuestionTool.register(readOnlyAnnotations);
getInputTool.register(readOnlyAnnotations);
inputExtractionTool.register(readOnlyAnnotations);
templateDiscoveryTool.register(readOnlyAnnotations);
projectGenerationTool.register(readOnlyAnnotations);
buildTool.register(readOnlyAnnotations);
deploymentTool.register(readOnlyAnnotations);
xcodeAddFilesTool.register(readOnlyAnnotations);
completionTool.register(readOnlyAnnotations);
failureTool.register(readOnlyAnnotations);

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
