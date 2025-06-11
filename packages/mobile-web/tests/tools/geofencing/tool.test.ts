import {
  registerGeofencingTool,
  handleGeofencingRequest,
} from '../../../src/tools/geofencing/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Geofencing',
  registerTool: registerGeofencingTool,
  handleRequest: handleGeofencingRequest,
  typeDefinitionPath: 'geofencing/geofencingService.d.ts',
});

runCommonTests();
