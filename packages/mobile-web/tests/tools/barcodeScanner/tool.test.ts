import {
  registerBarcodeScannerTool,
  handleBarcodeScannerRequest,
} from '../../../src/tools/barcodeScanner/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Barcode Scanner',
  registerTool: registerBarcodeScannerTool,
  handleRequest: handleBarcodeScannerRequest,
  typeDefinitionPath: 'barcodeScanner/barcodeScanner.d.ts',
});

runCommonTests();
