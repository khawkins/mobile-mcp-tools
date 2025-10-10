/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dedent from 'dedent';
import { Logger } from '../../../logging/logger.js';
import { BUILD_TOOL, BuildWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';
import { TempDirectoryManager, defaultTempDirectoryManager } from '../../../common.js';

export class SFMobileNativeBuildTool extends AbstractWorkflowTool<typeof BUILD_TOOL> {
  private readonly tempDirManager: TempDirectoryManager;

  constructor(
    server: McpServer,
    tempDirManager: TempDirectoryManager = defaultTempDirectoryManager,
    logger?: Logger
  ) {
    super(server, BUILD_TOOL, 'BuildTool', logger);
    this.tempDirManager = tempDirManager;
  }

  public handleRequest = async (input: BuildWorkflowInput) => {
    const guidance = this.generateBuildGuidance(input);

    const finalOutput = this.finalizeWorkflowToolOutput(guidance, input.workflowStateData);
    return finalOutput;
  };

  private generateBuildGuidance(input: BuildWorkflowInput) {
    return dedent`
     You are a tech-adept agent acting on behalf of a user who is not familiar with the technical details of MSDK development. 
     Carry out the steps in the following guideline for them, and share the key outcomes they need to know.

     # Salesforce Mobile App Build Guidance for ${input.platform}

      ${input.platform === 'iOS' ? this.msdkAppBuildExecutionIOS(input.projectPath, input.projectName) : this.msdkAppBuildExecutionAndroid(input.projectPath)}
      
    `;
  }

  private msdkAppBuildExecutionIOS(projectPath: string, projectName: string) {
    return dedent`  
      ## iOS Build Execution
      Follow these instructions, step by step, to build the iOS App.

      1. Navigate to the ${projectPath} directory
      2. Run the following \`xcodebuild\` CLI command to build the iOS app:

         \`\`\`bash
         { xcodebuild -workspace ${projectName}.xcworkspace -scheme ${projectName} -destination 'generic/platform=iOS Simulator' clean build CONFIGURATION_BUILD_DIR="${this.tempDirManager.getAppArtifactRootPath(projectName)}" > "${this.tempDirManager.getIOSBuildOutputFilePath()}" 2>&1; echo $?; }
         \`\`\`
      
      3. The exit code of the command above will be printed to the console. If it is 0, the build completed
         successfully. If it is not 0, the build failed.
      4. If the build failed, check the "${this.tempDirManager.getIOSBuildOutputFilePath()}" file for the error
         message, and attempt to fix the issue.
      
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
