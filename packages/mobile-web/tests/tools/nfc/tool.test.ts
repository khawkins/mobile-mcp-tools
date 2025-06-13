import { NfcTool } from '../../../src/tools/nfc/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'NFC Service',
  toolClass: NfcTool,
  typeDefinitionPath: 'nfc/nfcService.d.ts',
});

runCommonTests();
