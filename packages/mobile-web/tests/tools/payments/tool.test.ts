import { registerPaymentsTool, handlePaymentsRequest } from '../../../src/tools/payments/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Payments',
  registerTool: registerPaymentsTool,
  handleRequest: handlePaymentsRequest,
  typeDefinitionPath: 'payments/paymentsService.d.ts',
});

runCommonTests();
