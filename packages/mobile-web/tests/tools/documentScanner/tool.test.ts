import {
  registerDocumentScannerTool,
  handleDocumentScannerRequest,
} from '../../../src/tools/documentScanner/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Document Scanner',
  registerTool: registerDocumentScannerTool,
  handleRequest: handleDocumentScannerRequest,
  typeDefinitionPath: 'documentScanner/documentScanner.d.ts',
});

runCommonTests();
