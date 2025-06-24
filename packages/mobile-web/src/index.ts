#!/usr/bin/env node

/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { version } from '../package.json';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

import { AppReviewTool } from './tools/appReview/tool.js';
import { ArSpaceCaptureTool } from './tools/arSpaceCapture/tool.js';
import { BarcodeScannerTool } from './tools/barcodeScanner/tool.js';
import { BiometricsTool } from './tools/biometrics/tool.js';
import { CalendarTool } from './tools/calendar/tool.js';
import { ContactsTool } from './tools/contacts/tool.js';
import { DocumentScannerTool } from './tools/documentScanner/tool.js';
import { GeofencingTool } from './tools/geofencing/tool.js';
import { LocationTool } from './tools/location/tool.js';
import { NfcTool } from './tools/nfc/tool.js';
import { PaymentsTool } from './tools/payments/tool.js';

const server = new McpServer({
  name: 'sfdc-mobile-web-mcp-server',
  version,
});

// Define annotations
const annotations: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

// Create and register all tools
const appReviewTool = new AppReviewTool(server, annotations);
const arSpaceCaptureTool = new ArSpaceCaptureTool(server, annotations);
const barcodeScannerTool = new BarcodeScannerTool(server, annotations);
const biometricsTool = new BiometricsTool(server, annotations);
const calendarTool = new CalendarTool(server, annotations);
const contactsTool = new ContactsTool(server, annotations);
const documentScanner = new DocumentScannerTool(server, annotations);
const geofencingTool = new GeofencingTool(server, annotations);
const locationTool = new LocationTool(server, annotations);
const nfcTool = new NfcTool(server, annotations);
const paymentsTool = new PaymentsTool(server, annotations);

appReviewTool.register();
arSpaceCaptureTool.register();
barcodeScannerTool.register();
biometricsTool.register();
calendarTool.register();
contactsTool.register();
documentScanner.register();
geofencingTool.register();
locationTool.register();
nfcTool.register();
paymentsTool.register();

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
