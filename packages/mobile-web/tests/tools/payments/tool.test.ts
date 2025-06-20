import { PaymentsTool } from '../../../src/tools/payments/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Payments Service',
  toolClass: PaymentsTool,
  typeDefinitionPath: 'payments/paymentsService.d.ts',
});

runCommonTests();
