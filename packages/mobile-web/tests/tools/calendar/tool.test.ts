import { registerCalendarTool, handleCalendarRequest } from '../../../src/tools/calendar/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Calendar',
  registerTool: registerCalendarTool,
  handleRequest: handleCalendarRequest,
  typeDefinitionPath: 'calendar/calendarService.d.ts',
});

runCommonTests();
