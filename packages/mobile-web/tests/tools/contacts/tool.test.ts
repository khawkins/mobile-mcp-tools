import { registerContactsTool, handleContactsRequest } from '../../../src/tools/contacts/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Contacts',
  registerTool: registerContactsTool,
  handleRequest: handleContactsRequest,
  typeDefinitionPath: 'contacts/contactsService.d.ts',
});

runCommonTests();
