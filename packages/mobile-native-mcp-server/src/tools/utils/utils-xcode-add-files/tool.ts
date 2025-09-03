/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Tool } from '../../tool.js';
import * as fs from 'fs';
import * as path from 'path';
import dedent from 'dedent';

// Input schema for the Xcode file addition tool
const XcodeAddFilesInputSchema = z.object({
  projectPath: z.string().describe('Absolute path to the Xcode project directory'),
  xcodeProjectPath: z.string().describe('Path to the .xcodeproj file (e.g., "MyApp.xcodeproj")'),
  newFilePaths: z.array(z.string()).describe('Array of newly created file paths relative to project root'),
  targetName: z.string().optional().describe('Optional: specific target to add files to (defaults to main app target)'),
});

type XcodeAddFilesInput = z.infer<typeof XcodeAddFilesInputSchema>;

interface XcodeAddFilesResult {
  success: boolean;
  command: string;
  projectPath: string;
  filePaths: string[];
  targetName?: string;
  message: string;
  error?: string;
}

export class UtilsXcodeAddFilesTool implements Tool {
  public readonly name = 'Utils Xcode Add Files';
  public readonly title = 'Xcode Project File Addition Utility';
  public readonly toolId = 'utils-xcode-add-files';
  public readonly description =
    'Generates a Ruby command using the xcodeproj gem to add files to Xcode projects';
  public readonly inputSchema = XcodeAddFilesInputSchema;

  public register(server: McpServer, annotations: ToolAnnotations): void {
    const enhancedAnnotations = {
      ...annotations,
      title: this.title,
    };

    server.tool(
      this.toolId,
      this.description,
      this.inputSchema.shape,
      enhancedAnnotations,
      this.handleRequest.bind(this)
    );
  }

  private async handleRequest(input: XcodeAddFilesInput) {
    try {
      const result = await this.addFilesToXcodeProject(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorResult: XcodeAddFilesResult = {
        success: false,
        command: '',
        projectPath: '',
        filePaths: [],
        message: 'Failed to generate command for adding files to Xcode project',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorResult, null, 2),
          },
        ],
      };
    }
  }

  private async addFilesToXcodeProject(input: XcodeAddFilesInput): Promise<XcodeAddFilesResult> {
    const { projectPath, xcodeProjectPath, newFilePaths, targetName } = input;
    
    // Construct full path to xcodeproj file
    const fullXcodeProjectPath = path.resolve(projectPath, xcodeProjectPath);
    const pbxprojPath = path.join(fullXcodeProjectPath, 'project.pbxproj');

    // Validate inputs
    if (!fs.existsSync(pbxprojPath)) {
      throw new Error(`Project file not found: ${pbxprojPath}`);
    }

    // Prepare arguments
    const absoluteFilePaths = newFilePaths.map(filePath => 
      path.isAbsolute(filePath) ? filePath : path.resolve(projectPath, filePath)
    );

    // Build the inline Ruby command using xcodeproj gem
    const rubyCode = this.buildInlineRubyCode(fullXcodeProjectPath, targetName, absoluteFilePaths);
    const command = `ruby -e "${rubyCode}"`;
    
    return {
      success: true,
      command,
      projectPath: fullXcodeProjectPath,
      filePaths: absoluteFilePaths,
      targetName,
      message: `Generated command to add ${newFilePaths.length} files to Xcode project`
    };
  }

  private buildInlineRubyCode(projectPath: string, targetName: string | undefined, filePaths: string[]): string {
    // Escape strings for shell
    const escapeForShell = (str: string) => str.replace(/"/g, '\\"').replace(/'/g, "\\'");
    
    const escapedProjectPath = escapeForShell(projectPath);
    const escapedTargetName = targetName ? `'${escapeForShell(targetName)}'` : 'nil';
    const escapedFilePaths = filePaths.map(fp => `'${escapeForShell(fp)}'`).join(', ');

    return dedent`
      require 'xcodeproj'
      require 'json'
      require 'pathname'

      begin
        project_path = '${escapedProjectPath}'
        target_name = ${escapedTargetName}
        files_to_add = [${escapedFilePaths}]

        unless File.exist?(project_path)
          puts JSON.generate({
            success: false,
            error: 'Project file not found',
            message: "Could not find Xcode project at #{project_path}"
          })
          exit 1
        end

        project = Xcodeproj::Project.open(project_path)
        target = target_name ? project.targets.find { |t| t.name == target_name } : project.targets.first

        unless target
          puts JSON.generate({
            success: false,
            error: 'Target not found',
            message: target_name ? "Could not find target '#{target_name}'" : 'No targets found in project'
          })
          exit 1
        end

        files_added = []
        files_failed = []

        files_to_add.each do |file_path|
          unless File.exist?(file_path)
            files_failed << file_path
            next
          end

          begin
            project_dir = File.dirname(project_path)
            relative_path = Pathname.new(file_path).relative_path_from(Pathname.new(project_dir)).to_s
            file_ref = project.main_group.new_file(relative_path)
            
            file_ext = File.extname(file_path).downcase
            source_extensions = ['.swift', '.m', '.mm', '.c', '.cpp', '.cc', '.cxx']
            
            if source_extensions.include?(file_ext)
              target.source_build_phase.add_file_reference(file_ref)
            end
            
            files_added << File.basename(file_path)
          rescue => e
            files_failed << "#{file_path}: #{e.message}"
          end
        end

        project.save

        result = {
          success: true,
          filesAdded: files_added,
          target: target.name,
          buildStatus: 'completed',
          message: "Successfully added #{files_added.length} files to Xcode project"
        }
        
        if files_failed.any?
          result[:warnings] = "Failed to add #{files_failed.length} files: #{files_failed.join(', ')}"
        end

        puts JSON.generate(result)

      rescue => e
        puts JSON.generate({
          success: false,
          error: e.class.name,
          message: e.message
        })
        exit 1
      end
    `;
  }
}
