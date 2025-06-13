import { ContactsTool } from '../../../src/tools/contacts/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Contacts Service',
  toolClass: ContactsTool,
  typeDefinitionPath: 'contacts/contactsService.d.ts',
});

runCommonTests();
