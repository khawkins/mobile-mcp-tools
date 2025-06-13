import { BiometricsTool } from '../../../src/tools/biometrics/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Biometrics Service',
  toolClass: BiometricsTool,
  typeDefinitionPath: 'biometrics/biometricsService.d.ts',
});

runCommonTests();
