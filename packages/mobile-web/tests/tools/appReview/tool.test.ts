import { AppReviewTool } from '../../../src/tools/appReview/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'App Review Service',
  toolClass: AppReviewTool,
  typeDefinitionPath: 'appReview/appReviewService.d.ts',
});

runCommonTests();
