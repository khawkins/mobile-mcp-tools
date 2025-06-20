import { ArSpaceCaptureTool } from '../../../src/tools/arSpaceCapture/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'AR Space Capture',
  toolClass: ArSpaceCaptureTool,
  typeDefinitionPath: 'arSpaceCapture/arSpaceCapture.d.ts',
});

runCommonTests();
