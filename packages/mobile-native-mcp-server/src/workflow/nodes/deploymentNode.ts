import { interrupt } from '@langchain/langgraph';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { State } from '../metadata.js';
import { AbstractSchemaNode } from './abstractSchemaNode.js';
import { DEPLOYMENT_TOOL } from '../../tools/run/sfmobile-native-deployment/metadata.js';

export class DeploymentNode extends AbstractSchemaNode<
  typeof DEPLOYMENT_TOOL.inputSchema,
  typeof DEPLOYMENT_TOOL.resultSchema,
  typeof DEPLOYMENT_TOOL.outputSchema
> {
  name = 'deployApp';
  protected readonly workflowToolMetadata = DEPLOYMENT_TOOL;

  execute(state: State): Partial<State> {
    const toolInvocationData: MCPToolInvocationData<typeof this.workflowToolMetadata.inputSchema> =
      {
        llmMetadata: {
          name: DEPLOYMENT_TOOL.toolId,
          description: DEPLOYMENT_TOOL.description,
          inputSchema: DEPLOYMENT_TOOL.inputSchema,
        },
        input: {
          platform: state.platform,
          projectPath: state.projectPath,
          buildType: state.buildType,
          targetDevice: state.targetDevice,
        },
      };

    const result = interrupt(toolInvocationData);
    const validatedResult = this.workflowToolMetadata.resultSchema.parse(result);
    return {
      ...validatedResult,
    };
  }
}
