#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import appReviewServer from './appReview/server';
import arSpaceCaptureServer from './arSpaceCapture/server';
import barcodeScannerServer from './barcodeScanner/server';
import biometricsServer from './biometrics/server';
import calendarServer from './calendar/server';
import contactsServer from './contacts/server';
import documentScannerServer from './documentScanner/server';
import locationServer from './location/server';
import nfcServer from './nfc/server';
import paymentsServer from './payments/server';

async function main() {
  const transport = new StdioServerTransport();

  // Connect all servers to the same transport
  await Promise.all([
    appReviewServer.connect(transport),
    arSpaceCaptureServer.connect(transport),
    barcodeScannerServer.connect(transport),
    biometricsServer.connect(transport),
    calendarServer.connect(transport),
    contactsServer.connect(transport),
    documentScannerServer.connect(transport),
    locationServer.connect(transport),
    nfcServer.connect(transport),
    paymentsServer.connect(transport),
  ]);

  console.error(`kh-mobile MCP Server running on stdio, from '${process.cwd()}'`);
}

main().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
