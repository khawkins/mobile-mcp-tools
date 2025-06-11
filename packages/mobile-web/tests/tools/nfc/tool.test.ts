import { registerNfcTool, handleNfcRequest } from '../../../src/tools/nfc/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'NFC',
  registerTool: registerNfcTool,
  handleRequest: handleNfcRequest,
  typeDefinitionPath: 'nfc/nfcService.d.ts',
});

runCommonTests();
