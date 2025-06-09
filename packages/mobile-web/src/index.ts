#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { version } from '../package.json';
import { McpToolAnnotations } from './utils/util.js';

import { registerAppReviewTool } from './tools/appReview/tool.js';
import { registerArSpaceCaptureTool } from './tools/arSpaceCapture/tool.js';
import { registerBarcodeScannerTool } from './tools/barcodeScanner/tool.js';
import { registerBiometricsTool } from './tools/biometrics/tool.js';
import { registerCalendarTool } from './tools/calendar/tool.js';
import { registerContactsTool } from './tools/contacts/tool.js';
import { registerDocumentScannerTool } from './tools/documentScanner/tool.js';
import { registerGeofencingTool } from './tools/geofencing/tool.js';
import { registerLocationTool } from './tools/location/tool.js';
import { registerNfcTool } from './tools/nfc/tool.js';
import { registerPaymentsTool } from './tools/payments/tool.js';

const server = new McpServer({
  name: 'sfdc-mobile-web-mcp-server',
  version,
});

// Define annotations
const annotations: McpToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

// Register all tools
registerAppReviewTool(server, annotations);
registerArSpaceCaptureTool(server, annotations);
registerBarcodeScannerTool(server, annotations);
registerBiometricsTool(server, annotations);
registerCalendarTool(server, annotations);
registerContactsTool(server, annotations);
registerDocumentScannerTool(server, annotations);
registerGeofencingTool(server, annotations);
registerLocationTool(server, annotations);
registerNfcTool(server, annotations);
registerPaymentsTool(server, annotations);

export default server;

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Salesforce Mobile Web MCP Server running on stdio, from '${process.cwd()}'`);
}

main().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
