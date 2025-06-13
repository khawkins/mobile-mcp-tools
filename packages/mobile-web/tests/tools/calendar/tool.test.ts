import { CalendarTool } from '../../../src/tools/calendar/tool.js';
import { setupToolTest } from '../../utils/tool-test-helper.js';

const { runCommonTests } = setupToolTest({
  toolName: 'Calendar Service',
  toolClass: CalendarTool,
  typeDefinitionPath: 'calendar/calendarService.d.ts',
});

runCommonTests();
