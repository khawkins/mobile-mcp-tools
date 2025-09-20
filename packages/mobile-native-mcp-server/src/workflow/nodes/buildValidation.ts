import { interrupt } from '@langchain/langgraph';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { State } from '../metadata.js';
import { AbstractSchemaNode } from './abstractSchemaNode.js';
import { BUILD_TOOL } from '../../tools/plan/sfmobile-native-build/metadata.js';

export class BuildValidationNode extends AbstractSchemaNode<
  typeof BUILD_TOOL.inputSchema,
  typeof BUILD_TOOL.resultSchema,
  typeof BUILD_TOOL.outputSchema
> {
  protected readonly workflowToolMetadata = BUILD_TOOL;

  constructor() {
    super('validateBuild');
  }

  execute(state: State): Partial<State> {
    const toolInvocationData: MCPToolInvocationData<typeof this.workflowToolMetadata.inputSchema> =
      {
        llmMetadata: {
          name: BUILD_TOOL.toolId,
          description: BUILD_TOOL.description,
          inputSchema: BUILD_TOOL.inputSchema,
        },
        input: {
          platform: state.platform,
          projectPath: state.projectPath,
        },
      };

    const result = interrupt(toolInvocationData);
    const validatedResult = this.workflowToolMetadata.resultSchema.parse(result);
    return {
      ...validatedResult,
    };
  }
}
