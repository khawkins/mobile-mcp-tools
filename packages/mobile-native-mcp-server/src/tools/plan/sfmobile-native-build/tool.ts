import { Tool } from '../../tool.js';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dedent from 'dedent';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const BuildInputSchema = z.object({
  platform: z.enum(['iOS', 'Android']).describe('Target mobile platform'),
  projectPath: z.string().describe('Path to the project'),
});

type BuildInput = z.infer<typeof BuildInputSchema>;

export class SfmobileNativeBuildTool implements Tool {
  readonly name = 'Salesforce Mobile App Build Tool';
  readonly title = 'Salesforce Mobile app build guide';
  readonly description =
    'Guides LLM through the process of building a Salesforce mobile app with target platform';
  public readonly toolId = 'sfmobile-native-build';
  readonly inputSchema = BuildInputSchema;
  readonly outputSchema = z.object({});

  public register(server: McpServer, annotations: ToolAnnotations): void {
    server.tool(
      this.toolId,
      this.description,
      this.inputSchema.shape,
      {
        ...annotations,
        title: this.title,
      },
      this.handleRequest.bind(this)
    );
  }

  private async handleRequest(input: BuildInput) {
    const guidance = this.generateBuildGuidance(input);

    return {
      content: [
        {
          type: 'text' as const,
          text: guidance,
        },
      ],
    };
  }

  private generateBuildGuidance(input: BuildInput) {
    return dedent`
     You are a tech-adept agent acting on behalf of a user who is not familiar with the technical details of MSDK development. 
     Carry out the steps in the following guideline for them, and share the key outcomes they need to know.

     # Salesforce Mobile App Build Guidance for ${input.platform}
      


      You MUST follow the steps in this guide in order. Do not execute any commands that are not part of the steps in this guide.

      ${this.msdkEnvironmentCheck(input.platform, input.platform === 'iOS' ? '17.0.1' : '35')}

      ${input.platform === 'iOS' ? this.msdkAppBuildExecutionIOS(input.projectPath) : this.msdkAppBuildExecutionAndroid(input.projectPath)}

      ${this.generateNextStepsSection()}
      
    `;
  }

  private msdkEnvironmentCheck(platform: string, apiLevel: string) {
    return dedent`
      ## Step 1: Environment Check
      First, verify the environment is set up correctly for the MSDK ${platform} App.

      \`\`\`bash
      sf force lightning local setup -p=${platform.toLowerCase()} -l=${apiLevel}
      \`\`\`

      If all items show as PASSED, the environment is set up correctly.
      If any item shows as FAILED, the environment is not set up correctly. In that case, resolve the issues before continuing with the build.

    `;
  }

  private msdkAppBuildExecutionIOS(projectPath: string) {
    return dedent`  
      ## Step 2: iOS Build Execution
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
      ## Step 2: Android Build Execution
      Navigate to the ${projectPath} directory and use the following command to build the MSDK Android App:

      \`\`\`bash
      ./gradlew build
      \`\`\`

      If **BUILD SUCCESSFUL** is shown as the output, the build is successful. If there are build errors like **FAILURE:Build failed**, please fix them and retry the build. Refer to the step 1 to fix the setup issues.
    `;
  }

  private generateNextStepsSection(): string {
    return dedent`
      ## Next Steps

      Once you've build successfully:
      1. Call the \`sfmobile-native-deployment\` tool to deploy the app to the target platform. For iOS, make sure to use the simulator type identifier or UDID from step 1.
    `;
  }
}
