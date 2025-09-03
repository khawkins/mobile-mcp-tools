/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UtilsXcodeAddFilesTool } from '../../../../src/tools/utils/utils-xcode-add-files/tool.js';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs');
const mockFs = vi.mocked(fs);

describe('UtilsXcodeAddFilesTool', () => {
  let tool: UtilsXcodeAddFilesTool;

  beforeEach(() => {
    tool = new UtilsXcodeAddFilesTool();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tool Properties', () => {
    it('should have correct tool properties', () => {
      expect(tool.name).toBe('Utils Xcode Add Files');
      expect(tool.title).toBe('Xcode Project File Addition Utility');
      expect(tool.toolId).toBe('utils-xcode-add-files');
      expect(tool.description).toBe(
        'Generates a Ruby command using the xcodeproj gem to add files to Xcode projects'
      );
    });

    it('should have input schema with required fields', () => {
      const schema = tool.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.shape).toBeDefined();
      expect(schema.shape.projectPath).toBeDefined();
      expect(schema.shape.xcodeProjectPath).toBeDefined();
      expect(schema.shape.newFilePaths).toBeDefined();
      expect(schema.shape.targetName).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    it('should register with MCP server', () => {
      const mockServer = {
        tool: vi.fn(),
      };
      const mockAnnotations = {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      };

      tool.register(
        mockServer as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
        mockAnnotations
      );

      expect(mockServer.tool).toHaveBeenCalledWith(
        'utils-xcode-add-files',
        'Generates a Ruby command using the xcodeproj gem to add files to Xcode projects',
        expect.any(Object),
        expect.objectContaining({
          ...mockAnnotations,
          title: 'Xcode Project File Addition Utility',
        }),
        expect.any(Function)
      );
    });
  });

  describe('Command Generation', () => {
    const validInput = {
      projectPath: '/path/to/project',
      xcodeProjectPath: 'MyApp.xcodeproj',
      newFilePaths: ['ContactManager.swift', 'ContactView.swift'],
      targetName: 'MyApp',
    };

    beforeEach(() => {
      // Mock project.pbxproj file exists
      mockFs.existsSync.mockImplementation(filePath => {
        return filePath === '/path/to/project/MyApp.xcodeproj/project.pbxproj';
      });
    });

    it('should generate Ruby command successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(validInput);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.command).toContain('ruby -e');
      expect(parsedResult.command).toContain("require 'xcodeproj'");
      expect(parsedResult.projectPath).toBe('/path/to/project/MyApp.xcodeproj');
      expect(parsedResult.filePaths).toEqual([
        '/path/to/project/ContactManager.swift',
        '/path/to/project/ContactView.swift',
      ]);
      expect(parsedResult.targetName).toBe('MyApp');
      expect(parsedResult.message).toBe('Generated command to add 2 files to Xcode project');
    });

    it('should handle absolute file paths', async () => {
      const inputWithAbsolutePaths = {
        ...validInput,
        newFilePaths: ['/absolute/path/ContactManager.swift', 'relative/ContactView.swift'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(inputWithAbsolutePaths);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.filePaths).toEqual([
        '/absolute/path/ContactManager.swift',
        '/path/to/project/relative/ContactView.swift',
      ]);
    });

    it('should handle optional targetName', async () => {
      const inputWithoutTarget = {
        projectPath: '/path/to/project',
        xcodeProjectPath: 'MyApp.xcodeproj',
        newFilePaths: ['ContactManager.swift'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(inputWithoutTarget);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.targetName).toBeUndefined();
      expect(parsedResult.command).toContain('target_name = nil');
    });
  });

  describe('Ruby Command Content', () => {
    const validInput = {
      projectPath: '/path/to/project',
      xcodeProjectPath: 'MyApp.xcodeproj',
      newFilePaths: ['ContactManager.swift'],
      targetName: 'MyApp',
    };

    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should generate Ruby command with proper structure', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(validInput);

      const parsedResult = JSON.parse(result.content[0].text);
      const command = parsedResult.command;

      // Check for required Ruby gems
      expect(command).toContain("require 'xcodeproj'");
      expect(command).toContain("require 'json'");
      expect(command).toContain("require 'pathname'");

      // Check for project operations
      expect(command).toContain('Xcodeproj::Project.open');
      expect(command).toContain('project.main_group.new_file');
      expect(command).toContain('target.source_build_phase.add_file_reference');
      expect(command).toContain('project.save');

      // Check for error handling
      expect(command).toContain('rescue => e');
      expect(command).toContain('JSON.generate');
    });

    it('should include file type detection logic', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(validInput);

      const parsedResult = JSON.parse(result.content[0].text);
      const command = parsedResult.command;

      expect(command).toContain('source_extensions = [');
      expect(command).toContain("'.swift'");
      expect(command).toContain("'.m'");
      expect(command).toContain("'.mm'");
      expect(command).toContain("'.c'");
      expect(command).toContain("'.cpp'");
    });

    it('should handle string escaping in Ruby command', async () => {
      const inputWithSpecialChars = {
        ...validInput,
        projectPath: '/path/with\'quotes/and"double',
        newFilePaths: ["File'With'Quotes.swift"],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(inputWithSpecialChars);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(true);

      const command = parsedResult.command;
      expect(command).toContain("\\'"); // Escaped single quotes
      expect(command).toContain('\\"'); // Escaped double quotes
    });
  });

  describe('Error Handling', () => {
    it('should return error when project file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const input = {
        projectPath: '/nonexistent/project',
        xcodeProjectPath: 'MyApp.xcodeproj',
        newFilePaths: ['ContactManager.swift'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(input);

      expect(result.isError).toBe(true);
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error).toContain('Project file not found');
    });

    it('should handle internal errors gracefully', async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const input = {
        projectPath: '/path/to/project',
        xcodeProjectPath: 'MyApp.xcodeproj',
        newFilePaths: ['ContactManager.swift'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(input);

      expect(result.isError).toBe(true);
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error).toBe('File system error');
    });
  });

  describe('Path Resolution', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should resolve relative xcodeproj path correctly', async () => {
      const input = {
        projectPath: '/base/project',
        xcodeProjectPath: 'subdir/MyApp.xcodeproj',
        newFilePaths: ['ContactManager.swift'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(input);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.projectPath).toBe('/base/project/subdir/MyApp.xcodeproj');
    });

    it('should handle absolute xcodeproj path', async () => {
      const input = {
        projectPath: '/base/project',
        xcodeProjectPath: '/absolute/path/MyApp.xcodeproj',
        newFilePaths: ['ContactManager.swift'],
      };

      // Mock the absolute path exists
      mockFs.existsSync.mockImplementation(filePath => {
        return filePath === '/absolute/path/MyApp.xcodeproj/project.pbxproj';
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).handleRequest(input);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.projectPath).toBe('/absolute/path/MyApp.xcodeproj');
    });
  });
});
