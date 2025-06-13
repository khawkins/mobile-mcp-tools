import { BarcodeScannerTool } from '../../../src/tools/barcodeScanner/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Barcode Scanner',
  toolClass: BarcodeScannerTool,
  typeDefinitionPath: 'barcodeScanner/barcodeScanner.d.ts',
});

runCommonTests();
