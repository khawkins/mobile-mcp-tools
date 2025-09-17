import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dedent from 'dedent';
import { AbstractTool } from '../../base/abstractTool.js';
import { Logger } from '../../../logging/logger.js';
import { ToolInputShape, ToolInputType } from '../../../common/metadata.js';
import { BUILD_OUTPUT_SCHEMA, BUILD_TOOL } from './metadata.js';

export class SfmobileNativeBuildTool extends AbstractTool<ToolInputShape<typeof BUILD_TOOL>> {
  public readonly toolId = BUILD_TOOL.toolId;
  public readonly name = BUILD_TOOL.name;
  public readonly title = BUILD_TOOL.title;
  public readonly description = BUILD_TOOL.description;
  public readonly inputSchema = BUILD_TOOL.inputSchema;
  public readonly outputSchema = BUILD_OUTPUT_SCHEMA;

  constructor(server: McpServer, logger?: Logger) {
    super(server, 'BuildTool', logger);
  }

  protected async handleRequest(input: ToolInputType<typeof BUILD_TOOL>) {
    const guidance = this.generateBuildGuidance(input);

    // Add workflow round-tripping instructions if this is part of a workflow
    const finalOutput = input.workflowStateData
      ? this.addPostInvocationInstructions(
          guidance,
          'the complete build validation results and any build issues that were resolved',
          input.workflowStateData
        )
      : guidance;

    return {
      content: [
        {
          type: 'text' as const,
          text: finalOutput,
        },
      ],
    };
  }

  private generateBuildGuidance(input: ToolInputType<typeof BUILD_TOOL>) {
    return dedent`
     You are a tech-adept agent acting on behalf of a user who is not familiar with the technical details of MSDK development. 
     Carry out the steps in the following guideline for them, and share the key outcomes they need to know.

     # Salesforce Mobile App Build Guidance for ${input.platform}
      

      ${input.platform === 'iOS' ? this.msdkAppBuildExecutionIOS(input.projectPath) : this.msdkAppBuildExecutionAndroid(input.projectPath)}
      
    `;
  }

  private msdkAppBuildExecutionIOS(projectPath: string) {
    return dedent`  
      ## iOS Build Execution
      Navigate to the ${projectPath} directory and run the following command to build the MSDK iOS App:

      \`\`\`bash
      xcodebuild -workspace <your-workspace>.xcworkspace -scheme <your-scheme> -destination <simulator-destination> clean build
      \`\`\`

      Replace <your-workspace>.xcworkspace and <your-scheme> with the actual workspace and scheme names of your project. Ensure that <simulator-destination>  points to a valid simulator running iOS 17.0 or greater.

      If the output includes **BUILD SUCCEEDED**, the build completed successfully. If you see errors such as **error:** or **Undefined symbol**, resolve them and try again. Refer back to Step 1 for guidance on fixing setup issues.
      
      
    `;
  }

  private msdkAppBuildExecutionAndroid(projectPath: string) {
    return dedent`  
      ## Android Build Execution
      Navigate to the ${projectPath} directory and use the following command to build the MSDK Android App:

      \`\`\`bash
      ./gradlew build
      \`\`\`

      If **BUILD SUCCESSFUL** is shown as the output, the build is successful. If there are build errors like **FAILURE:Build failed**, please fix them and retry the build. Refer to the step 1 to fix the setup issues.
    `;
  }
}
