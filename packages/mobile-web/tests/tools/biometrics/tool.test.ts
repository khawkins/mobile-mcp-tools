import {
  registerBiometricsTool,
  handleBiometricsRequest,
} from '../../../src/tools/biometrics/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Biometrics',
  registerTool: registerBiometricsTool,
  handleRequest: handleBiometricsRequest,
  typeDefinitionPath: 'biometrics/biometricsService.d.ts',
});

runCommonTests();
