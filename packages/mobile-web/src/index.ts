#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { version } from '../package.json';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

import { AppReviewTool } from './tools/native-capabilities/appReview/tool.js';
import { ArSpaceCaptureTool } from './tools/native-capabilities/arSpaceCapture/tool.js';
import { BarcodeScannerTool } from './tools/native-capabilities/barcodeScanner/tool.js';
import { BiometricsTool } from './tools/native-capabilities/biometrics/tool.js';
import { CalendarTool } from './tools/native-capabilities/calendar/tool.js';
import { ContactsTool } from './tools/native-capabilities/contacts/tool.js';
import { DocumentScannerTool } from './tools/native-capabilities/documentScanner/tool.js';
import { GeofencingTool } from './tools/native-capabilities/geofencing/tool.js';
import { LocationTool } from './tools/native-capabilities/location/tool.js';
import { NfcTool } from './tools/native-capabilities/nfc/tool.js';
import { PaymentsTool } from './tools/native-capabilities/payments/tool.js';
import { LintTool } from './tools/mobile-offline/offline-analysis/tool.js';

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
const lintTool = new LintTool(server, annotations);

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
lintTool.register();

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
