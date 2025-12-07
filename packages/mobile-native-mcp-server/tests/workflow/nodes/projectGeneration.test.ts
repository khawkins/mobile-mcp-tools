/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProjectGenerationNode } from '../../../src/workflow/nodes/projectGeneration.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { MockLogger } from '../../utils/MockLogger.js';
import * as childProcess from 'child_process';
import * as fs from 'fs';

// Mock execSync, existsSync, and readdirSync
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('fs', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  };
});

describe('ProjectGenerationNode', () => {
  let node: ProjectGenerationNode;
  let mockLogger: MockLogger;
  let mockExecSync: ReturnType<typeof vi.fn>;
  let mockExistsSync: ReturnType<typeof vi.fn>;
  let mockReaddirSync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = new MockLogger();
    node = new ProjectGenerationNode(mockLogger);
    mockExecSync = vi.mocked(childProcess.execSync);
    mockExistsSync = vi.mocked(fs.existsSync);
    mockReaddirSync = vi.mocked(fs.readdirSync);
    mockExecSync.mockReset();
    mockExistsSync.mockReset();
    mockReaddirSync.mockReset();

    // Default to success case
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['MyApp.xcodeproj'] as unknown as string[]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct node name', () => {
      expect(node.name).toBe('generateProject');
    });

    it('should extend BaseNode', () => {
      expect(node).toBeDefined();
      expect(node.name).toBeDefined();
      expect(node.execute).toBeDefined();
    });

    it('should create default logger when none provided', () => {
      const nodeWithoutLogger = new ProjectGenerationNode();
      expect(nodeWithoutLogger).toBeDefined();
    });

    it('should use provided logger', () => {
      const customLogger = new MockLogger();
      const nodeWithCustomLogger = new ProjectGenerationNode(customLogger);
      expect(nodeWithCustomLogger['logger']).toBe(customLogger);
    });
  });

  describe('execute() - iOS Platform - Success', () => {
    it('should generate iOS project successfully', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockExecSync.mockReturnValue('Project generated successfully');

      const result = node.execute(inputState);

      expect(result.projectPath).toBeDefined();
      expect(result.projectPath).toContain('MyiOSApp');
      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('sf mobilesdk ios createwithtemplate'),
        expect.objectContaining({ encoding: 'utf-8', timeout: 120000 })
      );
    });

    it('should use correct command format for iOS', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: undefined,
      });

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('--template="ContactsApp"'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('--appname="MyiOSApp"'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('--consumerkey="client123"'),
        expect.any(Object)
      );
    });

    it('should validate iOS project structure', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockReturnValue(['MyiOSApp.xcodeproj', 'Podfile'] as unknown as string[]);
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
      // Should validate iOS project structure by reading directory
      expect(mockReaddirSync).toHaveBeenCalled();
    });
  });

  describe('execute() - iOS Platform - Validation Failures', () => {
    it('should fail when .xcodeproj directory is missing', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockReturnValue(['Podfile', 'README.md'] as unknown as string[]);

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
      expect(result.workflowFatalErrorMessages![0]).toContain(
        'not a valid iOS project. Missing required files'
      );
    });

    it('should fail when readdirSync throws an error', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain('not a valid iOS project');
    });

    it('should succeed when .xcodeproj exists even if other files are missing', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      // Only .xcodeproj exists, no Podfile
      mockReaddirSync.mockReturnValue(['MyiOSApp.xcodeproj'] as unknown as string[]);
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(result.projectPath).toBeDefined();
    });

    it('should handle .xcworkspace files in project directory', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockReturnValue([
        'MyiOSApp.xcodeproj',
        'MyiOSApp.xcworkspace',
        'Podfile',
      ] as unknown as string[]);
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(result.projectPath).toBeDefined();
    });

    it('should detect .xcodeproj even with different naming', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      // Project name doesn't match .xcodeproj name
      mockReaddirSync.mockReturnValue([
        'DifferentName.xcodeproj',
        'Podfile',
      ] as unknown as string[]);
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(result.projectPath).toBeDefined();
    });
  });

  describe('execute() - Android Platform - Success', () => {
    it('should generate Android project successfully with valid structure', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: 'https://test.salesforce.com',
      });

      mockExecSync.mockReturnValue('Project generated successfully');
      mockExistsSync.mockReturnValue(true); // All files exist

      const result = node.execute(inputState);

      expect(result.projectPath).toBeDefined();
      expect(result.projectPath).toContain('MyAndroidApp');
      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('sf mobilesdk android createwithtemplate'),
        expect.objectContaining({ encoding: 'utf-8', timeout: 120000 })
      );
    });

    it('should validate Android project structure', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
      // Should check for Android manifest (using regex to handle both Unix and Windows path separators)
      expect(mockExistsSync).toHaveBeenCalledWith(
        expect.stringMatching(/app[/\\]src[/\\]main[/\\]AndroidManifest\.xml/)
      );
    });

    it('should accept Kotlin build files as alternative', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      // Mock scenario: Groovy files don't exist, but Kotlin files do
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = String(path);
        if (pathStr.endsWith('.gradle')) return false;
        if (pathStr.endsWith('.gradle.kts')) return true;
        return true; // Other files exist
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
    });

    it('should accept Groovy build files', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      // Mock scenario: Groovy files exist, Kotlin files don't
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = String(path);
        if (pathStr.endsWith('.gradle.kts')) return false;
        if (pathStr.endsWith('.gradle')) return true;
        return true; // Other files exist
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeUndefined();
    });
  });

  describe('execute() - Android Platform - Validation Failures', () => {
    it('should fail when build.gradle and build.gradle.kts both missing', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      // Mock: Both build.gradle and build.gradle.kts don't exist
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = String(path);
        if (pathStr.includes('build.gradle')) return false;
        return true;
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
      expect(result.workflowFatalErrorMessages![0]).toContain(
        'not a valid Android project. Missing required files'
      );
    });

    it('should fail when AndroidManifest.xml is missing', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = String(path);
        if (pathStr.includes('AndroidManifest.xml')) return false;
        return true;
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain(
        'not a valid Android project. Missing required files'
      );
    });

    it('should fail when app directory is missing', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = String(path);
        if (pathStr.endsWith('/app') || pathStr.endsWith('\\app')) return false;
        return true;
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain('not a valid Android project');
    });

    it('should fail when settings.gradle and settings.gradle.kts both missing', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = String(path);
        if (pathStr.includes('settings.gradle')) return false;
        return true;
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain('not a valid Android project');
    });
  });

  describe('execute() - Project Directory Verification', () => {
    it('should fail when project directory does not exist after command execution', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Command completed');
      // First call to existsSync (project directory check) returns false
      // This simulates the directory not being created
      mockExistsSync.mockReturnValue(false);

      const result = node.execute(inputState);

      expect(result.projectPath).toBeUndefined();
      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
      expect(result.workflowFatalErrorMessages![0]).toContain('Project directory not found');
      expect(result.workflowFatalErrorMessages![0]).toContain(
        'command executed successfully but the project was not created'
      );
    });

    it('should log error when project directory does not exist', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Command completed');
      mockExistsSync.mockReturnValue(false);
      mockLogger.reset();

      node.execute(inputState);

      const errorLogs = mockLogger.getLogsByLevel('error');
      const missingDirLog = errorLogs.find(log =>
        log.message.includes('Project directory not found after command execution')
      );
      expect(missingDirLog).toBeDefined();
    });

    it('should proceed with validation when project directory exists', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['MyiOSApp.xcodeproj'] as unknown as string[]);

      const result = node.execute(inputState);

      expect(result.projectPath).toBeDefined();
      expect(result.workflowFatalErrorMessages).toBeUndefined();
    });
  });

  describe('execute() - Command Execution Errors', () => {
    it('should handle execSync throwing an error', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found: sf');
      });

      const result = node.execute(inputState);

      expect(result.projectPath).toBeUndefined();
      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
      expect(result.workflowFatalErrorMessages![0]).toContain('Failed to generate project');
      expect(result.workflowFatalErrorMessages![0]).toContain('Command not found: sf');
    });

    it('should handle non-Error exceptions', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockImplementation(() => {
        throw 'Unknown error';
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain('Failed to generate project');
      expect(result.workflowFatalErrorMessages![0]).toContain('Unknown error');
    });

    it('should handle timeout errors', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockImplementation(() => {
        const error = new Error('Command timed out after 120000ms');
        throw error;
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain('timed out');
    });

    it('should handle permission errors', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages![0]).toContain('permission denied');
    });
  });

  describe('execute() - Logging', () => {
    it('should log debug message before command execution', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const preExecutionLog = debugLogs.find(log =>
        log.message.includes('Executing project generation command')
      );
      expect(preExecutionLog).toBeDefined();
    });

    it('should log debug message after command execution', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const postExecutionLog = debugLogs.find(log =>
        log.message.includes('Command executed successfully')
      );
      expect(postExecutionLog).toBeDefined();
    });

    it('should log Android validation success', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const validationLog = debugLogs.find(log =>
        log.message.includes('Android project structure validation passed')
      );
      expect(validationLog).toBeDefined();
    });

    it('should log iOS validation success', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockReturnValue(['MyiOSApp.xcodeproj'] as unknown as string[]);
      mockExistsSync.mockReturnValue(true);
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const validationLog = debugLogs.find(log =>
        log.message.includes('iOS project structure validation passed')
      );
      expect(validationLog).toBeDefined();
    });

    it('should log warning for missing Android files', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      // First call (project directory check) returns true, subsequent calls return false
      let callCount = 0;
      mockExistsSync.mockImplementation(() => {
        callCount++;
        return callCount === 1; // Only first call returns true
      });
      mockLogger.reset();

      node.execute(inputState);

      const warnLogs = mockLogger.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
    });

    it('should log warning for missing iOS .xcodeproj', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockReturnValue(['Podfile', 'README.md'] as unknown as string[]);
      mockLogger.reset();

      node.execute(inputState);

      const warnLogs = mockLogger.getLogsByLevel('warn');
      const missingXcodeprojLog = warnLogs.find(log =>
        log.message.includes('Missing required .xcodeproj directory')
      );
      expect(missingXcodeprojLog).toBeDefined();
    });

    it('should log warning when iOS project directory cannot be read', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockReaddirSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });
      mockLogger.reset();

      node.execute(inputState);

      const warnLogs = mockLogger.getLogsByLevel('warn');
      const readFailLog = warnLogs.find(log =>
        log.message.includes('Failed to read iOS project directory')
      );
      expect(readFailLog).toBeDefined();
    });

    it('should log error when command fails', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      mockLogger.reset();

      node.execute(inputState);

      const errorLogs = mockLogger.getLogsByLevel('error');
      const commandFailLog = errorLogs.find(log =>
        log.message.includes('Project generation failed')
      );
      expect(commandFailLog).toBeDefined();
    });

    it('should not log sensitive credentials in debug messages', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'secret-client-id-12345',
        connectedAppCallbackUri: 'myapp://secret-callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockLogger.reset();

      node.execute(inputState);

      const allLogs = mockLogger.logs;
      // Verify sensitive data is not in log messages
      allLogs.forEach(log => {
        expect(log.message).not.toContain('secret-client-id-12345');
        expect(log.message).not.toContain('secret-callback');
      });
    });

    it('should log "Command executed successfully" before validation', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Project created successfully');
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const commandExecutedLog = debugLogs.find(log =>
        log.message.includes('Command executed successfully')
      );
      expect(commandExecutedLog).toBeDefined();
    });

    it('should log "Project generation completed successfully" only after validation passes', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);
      mockLogger.reset();

      node.execute(inputState);

      const infoLogs = mockLogger.getLogsByLevel('info');
      const completionLog = infoLogs.find(log =>
        log.message.includes('Project generation completed successfully')
      );
      expect(completionLog).toBeDefined();
    });

    it('should not log completion message when validation fails', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(false); // Validation will fail
      mockLogger.reset();

      node.execute(inputState);

      const infoLogs = mockLogger.getLogsByLevel('info');
      const completionLog = infoLogs.find(log =>
        log.message.includes('Project generation completed successfully')
      );
      expect(completionLog).toBeUndefined();
    });
  });

  describe('execute() - Return Value', () => {
    it('should return partial state object on success', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('projectPath');
      expect(typeof result.projectPath).toBe('string');
    });

    it('should return projectPath on success', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      const result = node.execute(inputState);

      expect(result.projectPath).toBeDefined();
      expect(result.workflowFatalErrorMessages).toBeUndefined();
    });

    it('should return error messages on failure', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('Failed');
      });

      const result = node.execute(inputState);

      expect(result.projectPath).toBeUndefined();
      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(Array.isArray(result.workflowFatalErrorMessages)).toBe(true);
    });
  });

  describe('execute() - Command Timeout Configuration', () => {
    it('should set timeout to 120000ms', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      expect(mockExecSync).toHaveBeenCalledWith(expect.any(String), {
        encoding: 'utf-8',
        timeout: 120000,
      });
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle typical iOS project generation', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'SalesApp',
        packageName: 'com.salesforce.sales',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9...actual_client_id',
        connectedAppCallbackUri: 'salesapp://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockExecSync.mockReturnValue('Project created successfully at /Users/developer/SalesApp');

      const result = node.execute(inputState);

      expect(result.projectPath).toContain('SalesApp');
      expect(result.workflowFatalErrorMessages).toBeUndefined();
    });

    it('should handle typical Android project generation with sandbox', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'SalesApp',
        packageName: 'com.salesforce.sales',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9...actual_client_id',
        connectedAppCallbackUri: 'salesapp://callback',
        loginHost: 'https://test.salesforce.com',
      });

      mockExecSync.mockReturnValue('Project created successfully');
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.projectPath).toContain('SalesApp');
      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('https://test.salesforce.com'),
        expect.any(Object)
      );
    });

    it('should handle project generation in CI/CD environment', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'CIApp',
        packageName: 'com.example.ciapp',
        organization: 'CI',
        connectedAppClientId: 'ci-client-123',
        connectedAppCallbackUri: 'ciapp://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);

      const result = node.execute(inputState);

      expect(result.projectPath).toBeDefined();
      expect(result.workflowFatalErrorMessages).toBeUndefined();
    });
  });

  describe('execute() - Template Properties', () => {
    it('should include template properties flags when templateProperties exist', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: 'https://login.salesforce.com',
        templateProperties: {
          customField: 'customValue',
        },
      });

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('--template-property-customField="customValue"'),
        expect.any(Object)
      );
    });

    it('should include multiple template properties flags', () => {
      const inputState = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyAndroidApp',
        packageName: 'com.example.myandroidapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        templateProperties: {
          apiVersion: '60.0',
          customObject: 'Account',
          enableFeatureX: 'true',
        },
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);

      node.execute(inputState);

      const command = mockExecSync.mock.calls[0][0] as string;
      expect(command).toContain('--template-property-apiVersion="60.0"');
      expect(command).toContain('--template-property-customObject="Account"');
      expect(command).toContain('--template-property-enableFeatureX="true"');
    });

    it('should not include template properties flags when templateProperties is undefined', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        templateProperties: undefined,
      });

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      const command = mockExecSync.mock.calls[0][0] as string;
      expect(command).not.toContain('--template-property-');
    });

    it('should not include template properties flags when templateProperties is empty', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        templateProperties: {},
      });

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      const command = mockExecSync.mock.calls[0][0] as string;
      expect(command).not.toContain('--template-property-');
    });

    it('should log template properties in debug message', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        templateProperties: {
          customProp: 'customVal',
        },
      });

      mockExecSync.mockReturnValue('Success');
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const preExecutionLog = debugLogs.find(log =>
        log.message.includes('Executing project generation command')
      );
      expect(preExecutionLog).toBeDefined();
      // The log should include templateProperties in its data
      const logData = preExecutionLog?.data as Record<string, unknown> | undefined;
      expect(logData).toHaveProperty('templateProperties');
      expect(logData?.templateProperties).toEqual({ customProp: 'customVal' });
    });

    it('should handle template properties with special characters in values', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        templateProperties: {
          description: 'My App Description',
          url: 'https://example.com/api',
        },
      });

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      const command = mockExecSync.mock.calls[0][0] as string;
      expect(command).toContain('--template-property-description="My App Description"');
      expect(command).toContain('--template-property-url="https://example.com/api"');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle project names with spaces', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'My Sales App',
        packageName: 'com.example.mysalesapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      const result = node.execute(inputState);

      expect(result.projectPath).toContain('My Sales App');
    });

    it('should handle project names with special characters', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'My-App_2024',
        packageName: 'com.example.myapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      const result = node.execute(inputState);

      expect(result.projectPath).toContain('My-App_2024');
    });

    it('should handle very long project names', () => {
      const longName = 'A'.repeat(100);
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: longName,
        packageName: 'com.example.app',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      mockExecSync.mockReturnValue('Success');

      const result = node.execute(inputState);

      expect(result.projectPath).toContain(longName);
    });
  });

  describe('execute() - State Independence', () => {
    it('should not modify input state', () => {
      const inputState = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'MyiOSApp',
        packageName: 'com.example.myiosapp',
        organization: 'ExampleOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
      });

      const originalPlatform = inputState.platform;
      const originalProjectName = inputState.projectName;

      mockExecSync.mockReturnValue('Success');

      node.execute(inputState);

      expect(inputState.platform).toBe(originalPlatform);
      expect(inputState.projectName).toBe(originalProjectName);
    });

    it('should handle multiple invocations independently', () => {
      const state1 = createTestState({
        platform: 'iOS',
        selectedTemplate: 'ContactsApp',
        projectName: 'App1',
        packageName: 'com.example.app1',
        organization: 'Org1',
        connectedAppClientId: 'client1',
        connectedAppCallbackUri: 'app1://callback',
      });

      const state2 = createTestState({
        platform: 'Android',
        selectedTemplate: 'ContactsApp',
        projectName: 'App2',
        packageName: 'com.example.app2',
        organization: 'Org2',
        connectedAppClientId: 'client2',
        connectedAppCallbackUri: 'app2://callback',
      });

      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);

      const result1 = node.execute(state1);
      const result2 = node.execute(state2);

      expect(result1.projectPath).toContain('App1');
      expect(result2.projectPath).toContain('App2');
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });
});
