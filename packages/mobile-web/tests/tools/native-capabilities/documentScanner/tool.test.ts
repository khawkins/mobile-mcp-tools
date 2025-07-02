import { DocumentScannerTool } from '../../../src/tools/documentScanner/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Document Scanner',
  toolClass: DocumentScannerTool,
  typeDefinitionPath: 'documentScanner/documentScanner.d.ts',
});

runCommonTests();
