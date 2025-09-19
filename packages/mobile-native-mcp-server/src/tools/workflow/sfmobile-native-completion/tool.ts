import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../../logging/logger.js';
import { FINISH_TOOL, FinishWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class SfMobileNativeCompletionTool extends AbstractWorkflowTool<typeof FINISH_TOOL> {
  constructor(server: McpServer, logger?: Logger) {
    super(server, FINISH_TOOL, 'FinishTool', logger);
  }

  protected async handleRequest(input: FinishWorkflowInput) {
    const guidance = this.generateWorkflowCompletionGuidance(input);

    const finalOutput = this.finalizeWorkflowToolOutput(guidance, input.workflowStateData);
    return finalOutput;
  }

  private generateWorkflowCompletionGuidance(input: FinishWorkflowInput) {
    return `
You are the tool that closes out the workflow. Let the user know that the workflow has
completed successfully, and tell them that they can find their project directory at
'${input.projectPath}'. Thank the user for participating in the workflow.
    `;
  }
}
