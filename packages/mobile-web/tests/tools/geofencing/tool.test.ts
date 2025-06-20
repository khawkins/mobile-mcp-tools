import { GeofencingTool } from '../../../src/tools/geofencing/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Geofencing Service',
  toolClass: GeofencingTool,
  typeDefinitionPath: 'geofencing/geofencingService.d.ts',
});

runCommonTests();
