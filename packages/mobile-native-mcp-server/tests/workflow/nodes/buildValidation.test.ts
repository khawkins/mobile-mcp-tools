/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BuildValidationNode } from '../../../src/workflow/nodes/buildValidation.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { BUILD_TOOL } from '../../../src/tools/plan/sfmobile-native-build/metadata.js';

describe('BuildValidationNode', () => {
  let node: BuildValidationNode;
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockToolExecutor = new MockToolExecutor();
    mockLogger = new MockLogger();
    node = new BuildValidationNode(mockToolExecutor, mockLogger);
  });

  describe('Constructor', () => {
    it('should initialize with correct node name', () => {
      expect(node.name).toBe('validateBuild');
    });

    it('should extend AbstractToolNode', () => {
      expect(node).toBeDefined();
      expect(node.name).toBeDefined();
      expect(node.execute).toBeDefined();
    });

    it('should use provided tool executor', () => {
      expect(node['toolExecutor']).toBe(mockToolExecutor);
    });

    it('should use provided logger', () => {
      expect(node['logger']).toBe(mockLogger);
    });

    it('should create default tool executor when none provided', () => {
      const nodeWithoutExecutor = new BuildValidationNode(undefined, mockLogger);
      expect(nodeWithoutExecutor['toolExecutor']).toBeDefined();
      expect(nodeWithoutExecutor['toolExecutor']).not.toBe(mockToolExecutor);
    });

    it('should create default logger when none provided', () => {
      const nodeWithoutLogger = new BuildValidationNode(mockToolExecutor);
      expect(nodeWithoutLogger['logger']).toBeDefined();
      expect(nodeWithoutLogger['logger']).not.toBe(mockLogger);
    });
  });

  describe('execute() - Tool Invocation', () => {
    it('should invoke build tool with correct tool metadata', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.llmMetadata.name).toBe(BUILD_TOOL.toolId);
      expect(lastCall?.llmMetadata.description).toBe(BUILD_TOOL.description);
    });

    it('should pass platform, projectPath, and projectName to build tool', () => {
      const testPlatform = 'iOS';
      const testProjectPath = '/Users/test/MyApp';
      const testProjectName = 'MyApp';

      const inputState = createTestState({
        platform: testPlatform as 'iOS',
        projectPath: testProjectPath,
        projectName: testProjectName,
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input).toBeDefined();
      expect(lastCall?.input.platform).toBe(testPlatform);
      expect(lastCall?.input.projectPath).toBe(testProjectPath);
      expect(lastCall?.input.projectName).toBe(testProjectName);
    });

    it('should validate result against build result schema', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectPath: '/path/to/project',
        projectName: 'TestProject',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      expect(() => {
        node.execute(inputState);
      }).not.toThrow();
    });
  });

  describe('execute() - iOS Platform', () => {
    it('should handle iOS build validation', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectPath: '/Users/dev/ContactListApp-iOS',
        projectName: 'ContactListApp',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('iOS');
      expect(lastCall?.input.projectPath).toBe('/Users/dev/ContactListApp-iOS');
    });

    it('should pass iOS-specific project paths', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/Users/developer/MyApp.xcodeproj',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectPath).toContain('.xcodeproj');
    });
  });

  describe('execute() - Android Platform', () => {
    it('should handle Android build validation', () => {
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: '/home/dev/ContactListApp-Android',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('Android');
      expect(lastCall?.input.projectPath).toBe('/home/dev/ContactListApp-Android');
    });

    it('should pass Android-specific project paths', () => {
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: '/home/developer/MyApp/app',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectPath).toContain('/app');
    });
  });

  describe('execute() - Build Success Results', () => {
    it('should return build success result', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      const expectedResult = {
        buildSuccessful: true,
      };

      mockToolExecutor.setResult(BUILD_TOOL.toolId, expectedResult);

      const result = node.execute(inputState);

      expect(result).toEqual(expectedResult);
    });

    it('should handle successful build', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      const result = node.execute(inputState);

      expect(result.buildSuccessful).toBe(true);
    });
  });

  describe('execute() - Build Failure Results', () => {
    it('should handle failed build', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: false,
      });

      const result = node.execute(inputState);

      expect(result.buildSuccessful).toBe(false);
    });

    it('should return build failure result', () => {
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      const expectedResult = {
        buildSuccessful: false,
      };

      mockToolExecutor.setResult(BUILD_TOOL.toolId, expectedResult);

      const result = node.execute(inputState);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('execute() - Return Value', () => {
    it('should return validated result from tool executor', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      const expectedResult = {
        buildSuccessful: true,
      };

      mockToolExecutor.setResult(BUILD_TOOL.toolId, expectedResult);

      const result = node.execute(inputState);

      expect(result).toEqual(expectedResult);
    });

    it('should return partial state object', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('execute() - Logging', () => {
    it('should log tool invocation details', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      expect(debugLogs.length).toBeGreaterThan(0);

      const preExecutionLog = debugLogs.find(log =>
        log.message.includes('Tool invocation data (pre-execution)')
      );
      expect(preExecutionLog).toBeDefined();
    });

    it('should log tool result', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });
      mockLogger.reset();

      node.execute(inputState);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const postExecutionLog = debugLogs.find(log =>
        log.message.includes('Tool execution result (post-execution)')
      );
      expect(postExecutionLog).toBeDefined();
    });
  });

  describe('execute() - State Independence', () => {
    it('should only use platform, projectPath, and projectName from state', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectPath: '/path/to/project',
        projectName: 'TestProject',
        // Other state properties that should not be passed to the build tool
        packageName: 'com.test.app',
        organization: 'TestOrg',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input).toBeDefined();
      expect(lastCall?.input.platform).toBe('iOS');
      expect(lastCall?.input.projectPath).toBe('/path/to/project');
      expect(lastCall?.input.projectName).toBe('TestProject');
      expect(lastCall?.input).not.toHaveProperty('packageName');
      expect(lastCall?.input).not.toHaveProperty('organization');
    });

    it('should not modify input state', () => {
      const originalPlatform = 'iOS';
      const originalProjectPath = '/path/to/project';

      const inputState = createTestState({
        platform: originalPlatform as 'iOS',
        projectName: 'OriginalProject',
        projectPath: originalProjectPath,
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      expect(inputState.platform).toBe(originalPlatform);
      expect(inputState.projectPath).toBe(originalProjectPath);
    });
  });

  describe('execute() - Path Variations', () => {
    it('should handle absolute paths', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/Users/developer/workspace/MyApp',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectPath).toBe('/Users/developer/workspace/MyApp');
    });

    it('should handle relative paths', () => {
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: './projects/MyApp',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectPath).toBe('./projects/MyApp');
    });

    it('should handle paths with spaces', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/Users/test/My Project/My App',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectPath).toBe('/Users/test/My Project/My App');
    });

    it('should handle Windows paths', () => {
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: 'C:\\Users\\developer\\MyApp',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectPath).toBe('C:\\Users\\developer\\MyApp');
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle Contact List app iOS build', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/Users/developer/ContactListApp-iOS',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('iOS');
      expect(lastCall?.llmMetadata.name).toBe('sfmobile-native-build');
    });

    it('should handle Contact List app Android build', () => {
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: '/home/developer/ContactListApp-Android',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('Android');
    });

    it('should handle build validation after project generation', () => {
      const inputState = createTestState({
        platform: 'iOS',
        projectPath: '/Users/dev/MyApp',
        projectName: 'MyApp',
        packageName: 'com.example.myapp',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('iOS');
      expect(lastCall?.input.projectPath).toBe('/Users/dev/MyApp');
    });
  });

  describe('execute() - Multiple Invocations', () => {
    it('should handle multiple sequential invocations', () => {
      const state1 = createTestState({
        platform: 'iOS',
        projectName: 'TestProject',
        projectPath: '/path/to/project1',
      });

      const state2 = createTestState({
        platform: 'Android',
        projectName: 'TestProject',
        projectPath: '/path/to/project2',
      });

      mockToolExecutor.setResult(BUILD_TOOL.toolId, {
        buildSuccessful: true,
      });

      node.execute(state1);
      const call1 = mockToolExecutor.getLastCall();

      node.execute(state2);
      const call2 = mockToolExecutor.getLastCall();

      expect(call1?.input.platform).toBe('iOS');
      expect(call1?.input.projectPath).toBe('/path/to/project1');
      expect(call2?.input.platform).toBe('Android');
      expect(call2?.input.projectPath).toBe('/path/to/project2');
    });
  });
});
