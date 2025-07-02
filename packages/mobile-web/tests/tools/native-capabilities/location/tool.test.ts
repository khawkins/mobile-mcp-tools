import { LocationTool } from '../../../src/tools/location/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Location Service',
  toolClass: LocationTool,
  typeDefinitionPath: 'location/locationService.d.ts',
});

runCommonTests();
