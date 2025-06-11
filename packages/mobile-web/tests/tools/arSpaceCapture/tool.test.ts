import {
  registerArSpaceCaptureTool,
  handleArSpaceCaptureRequest,
} from '../../../src/tools/arSpaceCapture/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'AR Space Capture',
  registerTool: registerArSpaceCaptureTool,
  handleRequest: handleArSpaceCaptureRequest,
  typeDefinitionPath: 'arSpaceCapture/arSpaceCapture.d.ts',
});

runCommonTests();
