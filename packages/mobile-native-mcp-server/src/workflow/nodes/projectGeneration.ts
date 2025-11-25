/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseNode, createComponentLogger, Logger } from '@salesforce/magen-mcp-workflow';
import { State } from '../metadata.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { MOBILE_SDK_TEMPLATES_PATH } from '../../common.js';

export class ProjectGenerationNode extends BaseNode<State> {
  protected readonly logger: Logger;

  constructor(logger?: Logger) {
    super('generateProject');
    this.logger = logger ?? createComponentLogger('ProjectGenerationNode');
  }

  execute = (state: State): Partial<State> => {
    try {
      const platformLower = state.platform.toLowerCase();

      // Build the sf mobilesdk command with all parameters including sensitive credentials
      const command = `sf mobilesdk ${platformLower} createwithtemplate --templatesource="${MOBILE_SDK_TEMPLATES_PATH}" --template="${state.selectedTemplate}" --appname="${state.projectName}" --packagename="${state.packageName}" --organization="${state.organization}" --consumerkey="${state.connectedAppClientId}" --callbackurl="${state.connectedAppCallbackUri}" --loginserver="${state.loginHost || 'https://login.salesforce.com'}"`;

      this.logger.debug('Executing project generation command', {
        template: state.selectedTemplate,
        projectName: state.projectName,
        platform: state.platform,
      });

      // Execute the command directly without exposing credentials to LLM
      const output = execSync(command, { encoding: 'utf-8', timeout: 120000 });

      this.logger.debug('Project generation completed', { output });

      // Determine project path (the CLI creates the project in the current working directory)
      const projectPath = resolve(process.cwd(), state.projectName);

      // Validate Android project structure if platform is Android
      if (state.platform === 'Android') {
        const isValidAndroidProject = this.validateAndroidProjectStructure(projectPath);
        if (!isValidAndroidProject) {
          return {
            workflowFatalErrorMessages: [
              `Generated project at ${projectPath} is not a valid Android project. Missing required files or directories.`,
            ],
          };
        }
        this.logger.debug('Android project structure validation passed', { projectPath });
      }

      return {
        projectPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${error}`;
      if (error instanceof Error) {
        this.logger.error('Project generation failed', error);
      } else {
        this.logger.error(`Project generation failed: ${errorMessage}`);
      }
      return {
        workflowFatalErrorMessages: [
          `Failed to generate project: ${errorMessage}. Please ensure the Salesforce Mobile SDK CLI is properly installed and configured.`,
        ],
      };
    }
  };

  /**
   * Validates that the generated Android project has the required structure and files
   */
  private validateAndroidProjectStructure(projectPath: string): boolean {
    const requiredFiles = [
      // Root level Gradle files
      'build.gradle',
      'settings.gradle',
      // App module
      'app',
      'app/build.gradle',
      // Android manifest
      'app/src/main/AndroidManifest.xml',
    ];

    // Also check for Kotlin alternatives
    const alternativeFiles = [
      ['build.gradle', 'build.gradle.kts'],
      ['settings.gradle', 'settings.gradle.kts'],
      ['app/build.gradle', 'app/build.gradle.kts'],
    ];

    // Check that all required files/directories exist (with alternatives)
    for (const requiredFile of requiredFiles) {
      const fullPath = join(projectPath, requiredFile);

      // Skip files that have alternatives - we'll check them separately
      const hasAlternative = alternativeFiles.some(alt => alt[0] === requiredFile);
      if (hasAlternative) {
        continue;
      }

      if (!existsSync(fullPath)) {
        this.logger.warn('Missing required Android project file/directory', {
          path: fullPath,
        });
        return false;
      }
    }

    // Check files with alternatives - at least one version must exist
    for (const [groovyFile, kotlinFile] of alternativeFiles) {
      const groovyPath = join(projectPath, groovyFile);
      const kotlinPath = join(projectPath, kotlinFile);

      if (!existsSync(groovyPath) && !existsSync(kotlinPath)) {
        this.logger.warn('Missing required Android project file (checked both Groovy and Kotlin)', {
          groovyPath,
          kotlinPath,
        });
        return false;
      }
    }

    return true;
  }
}
