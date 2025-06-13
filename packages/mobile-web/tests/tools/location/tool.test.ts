import { registerLocationTool, handleLocationRequest } from '../../../src/tools/location/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Location',
  registerTool: registerLocationTool,
  handleRequest: handleLocationRequest,
  typeDefinitionPath: 'location/locationService.d.ts',
});

runCommonTests();
