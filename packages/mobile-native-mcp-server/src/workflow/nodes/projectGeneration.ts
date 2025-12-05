/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BaseNode, createComponentLogger, Logger } from '@salesforce/magen-mcp-workflow';
import { State } from '../metadata.js';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
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

      // Build template properties flags if they exist
      let templatePropertiesFlags = '';
      if (state.templateProperties && Object.keys(state.templateProperties).length > 0) {
        const propertyFlags = Object.entries(state.templateProperties)
          .map(([key, value]) => `--template-property-${key}="${value}"`)
          .join(' ');
        templatePropertiesFlags = ` ${propertyFlags}`;
      }

      // Build the sf mobilesdk command with all parameters including sensitive credentials
      const command = `sf mobilesdk ${platformLower} createwithtemplate --templatesource="${MOBILE_SDK_TEMPLATES_PATH}" --template="${state.selectedTemplate}" --appname="${state.projectName}" --packagename="${state.packageName}" --organization="${state.organization}" --consumerkey="${state.connectedAppClientId}" --callbackurl="${state.connectedAppCallbackUri}" --loginserver="${state.loginHost || 'https://login.salesforce.com'}" ${templatePropertiesFlags}`;

      this.logger.debug('Executing project generation command', {
        template: state.selectedTemplate,
        projectName: state.projectName,
        platform: state.platform,
        packageName: state.packageName,
        organization: state.organization,
        connectedAppClientId: state.connectedAppClientId,
        connectedAppCallbackUri: state.connectedAppCallbackUri,
        loginHost: state.loginHost,
        templateProperties: state.templateProperties,
      });

      // Execute the command directly without exposing credentials to LLM
      const output = execSync(command, { encoding: 'utf-8', timeout: 120000 });

      this.logger.debug('Command executed successfully', {
        outputLength: output.length,
        hasOutput: output.trim().length > 0,
      });

      // Determine project path (the CLI creates the project in the current working directory)
      const projectPath = resolve(process.cwd(), state.projectName);

      // Verify project directory was created
      if (!existsSync(projectPath)) {
        this.logger.error(
          `Project directory not found after command execution. Expected path: ${projectPath}`
        );
        return {
          workflowFatalErrorMessages: [
            `Project directory not found at ${projectPath}. The command executed successfully but the project was not created in the expected location.`,
          ],
        };
      }

      // Validate project structure based on platform
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
      } else if (state.platform === 'iOS') {
        const isValidiOSProject = this.validateiOSProjectStructure(projectPath);
        if (!isValidiOSProject) {
          return {
            workflowFatalErrorMessages: [
              `Generated project at ${projectPath} is not a valid iOS project. Missing required files or directories.`,
            ],
          };
        }
        this.logger.debug('iOS project structure validation passed', { projectPath });
      }

      // Log success only after all validation passes
      this.logger.info('Project generation completed successfully', {
        projectPath,
        platform: state.platform,
      });

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

  /**
   * Validates that the generated iOS project has the required structure and files
   */
  private validateiOSProjectStructure(projectPath: string): boolean {
    // Check for .xcodeproj directory (required)
    let foundXcodeproj = false;
    try {
      const files = readdirSync(projectPath);
      for (const file of files) {
        if (file.endsWith('.xcodeproj')) {
          const fullPath = join(projectPath, file);
          if (existsSync(fullPath)) {
            foundXcodeproj = true;
            break;
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to read iOS project directory', { projectPath, error });
      return false;
    }

    if (!foundXcodeproj) {
      this.logger.warn('Missing required .xcodeproj directory in iOS project', {
        projectPath,
      });
      return false;
    }

    return true;
  }
}
