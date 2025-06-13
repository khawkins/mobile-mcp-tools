import {
  registerAppReviewTool,
  handleAppReviewRequest,
} from '../../../src/tools/appReview/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'App Review',
  registerTool: registerAppReviewTool,
  handleRequest: handleAppReviewRequest,
  typeDefinitionPath: 'appReview/appReviewService.d.ts',
});

runCommonTests();
