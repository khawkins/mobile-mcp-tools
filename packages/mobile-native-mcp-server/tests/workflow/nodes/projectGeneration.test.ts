/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectGenerationNode } from '../../../src/workflow/nodes/projectGeneration.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { PROJECT_GENERATION_TOOL } from '../../../src/tools/plan/sfmobile-native-project-generation/metadata.js';

describe('ProjectGenerationNode', () => {
  let node: ProjectGenerationNode;
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockToolExecutor = new MockToolExecutor();
    mockLogger = new MockLogger();
    node = new ProjectGenerationNode(mockToolExecutor, mockLogger);
  });

  describe('Constructor', () => {
    it('should initialize with correct node name', () => {
      expect(node.name).toBe('generateProject');
    });

    it('should extend AbstractSchemaNode', () => {
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
      const nodeWithoutExecutor = new ProjectGenerationNode(undefined, mockLogger);
      expect(nodeWithoutExecutor['toolExecutor']).toBeDefined();
      expect(nodeWithoutExecutor['toolExecutor']).not.toBe(mockToolExecutor);
    });

    it('should create default logger when none provided', () => {
      const nodeWithoutLogger = new ProjectGenerationNode(mockToolExecutor);
      expect(nodeWithoutLogger['logger']).toBeDefined();
      expect(nodeWithoutLogger['logger']).not.toBe(mockLogger);
    });
  });

  describe('execute() - Tool Invocation', () => {
    it('should invoke project generation tool with correct tool metadata', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.llmMetadata.name).toBe(PROJECT_GENERATION_TOOL.toolId);
      expect(lastCall?.llmMetadata.description).toBe(PROJECT_GENERATION_TOOL.description);
    });

    it('should pass all required fields to project generation tool', () => {
      const testTemplate = 'iOSNativeSwiftTemplate';
      const testProjectName = 'MyApp';
      const testPlatform = 'iOS';
      const testPackageName = 'com.example.myapp';
      const testOrganization = 'Example Corp';
      const testClientId = 'client123';
      const testCallbackUri = 'myapp://oauth';
      const testLoginHost = 'https://test.salesforce.com';

      const inputState = createTestState({
        selectedTemplate: testTemplate,
        projectName: testProjectName,
        platform: testPlatform as 'iOS',
        packageName: testPackageName,
        organization: testOrganization,
        connectedAppClientId: testClientId,
        connectedAppCallbackUri: testCallbackUri,
        loginHost: testLoginHost,
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input).toBeDefined();
      expect(lastCall?.input.selectedTemplate).toBe(testTemplate);
      expect(lastCall?.input.projectName).toBe(testProjectName);
      expect(lastCall?.input.platform).toBe(testPlatform);
      expect(lastCall?.input.packageName).toBe(testPackageName);
      expect(lastCall?.input.organization).toBe(testOrganization);
      expect(lastCall?.input.connectedAppClientId).toBe(testClientId);
      expect(lastCall?.input.connectedAppCallbackUri).toBe(testCallbackUri);
      expect(lastCall?.input.loginHost).toBe(testLoginHost);
    });

    it('should validate result against project generation result schema', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      expect(() => {
        node.execute(inputState);
      }).not.toThrow();
    });
  });

  describe('execute() - iOS Project Generation', () => {
    it('should handle iOS Swift template', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'ContactListApp',
        platform: 'iOS',
        packageName: 'com.salesforce.contactlist',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9test',
        connectedAppCallbackUri: 'contactlist://oauth',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/Users/dev/ContactListApp-iOS',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('iOS');
      expect(lastCall?.input.selectedTemplate).toBe('iOSNativeSwiftTemplate');
    });

    it('should handle iOS MobileSyncExplorer template', () => {
      const inputState = createTestState({
        selectedTemplate: 'MobileSyncExplorerSwift',
        projectName: 'SyncApp',
        platform: 'iOS',
        packageName: 'com.salesforce.sync',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9test',
        connectedAppCallbackUri: 'syncapp://oauth',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/Users/dev/SyncApp-iOS',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.selectedTemplate).toBe('MobileSyncExplorerSwift');
    });
  });

  describe('execute() - Android Project Generation', () => {
    it('should handle Android Kotlin template', () => {
      const inputState = createTestState({
        selectedTemplate: 'AndroidNativeKotlinTemplate',
        projectName: 'ContactListApp',
        platform: 'Android',
        packageName: 'com.salesforce.contactlist',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9test',
        connectedAppCallbackUri: 'contactlist://oauth',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/home/dev/ContactListApp-Android',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.platform).toBe('Android');
      expect(lastCall?.input.selectedTemplate).toBe('AndroidNativeKotlinTemplate');
    });

    it('should handle Android MobileSyncExplorer template', () => {
      const inputState = createTestState({
        selectedTemplate: 'MobileSyncExplorerKotlinTemplate',
        projectName: 'SyncApp',
        platform: 'Android',
        packageName: 'com.salesforce.sync',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9test',
        connectedAppCallbackUri: 'syncapp://oauth',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/home/dev/SyncApp-Android',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.selectedTemplate).toBe('MobileSyncExplorerKotlinTemplate');
    });
  });

  describe('execute() - Package Names', () => {
    it('should handle standard package name format', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.company.app',
        organization: 'Company',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.packageName).toBe('com.company.app');
    });

    it('should handle reverse domain notation', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'io.github.myproject.mobile',
        organization: 'GitHub Project',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.packageName).toBe('io.github.myproject.mobile');
    });
  });

  describe('execute() - Login Hosts', () => {
    it('should handle production login host', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.loginHost).toBe('https://login.salesforce.com');
    });

    it('should handle sandbox login host', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://test.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.loginHost).toBe('https://test.salesforce.com');
    });

    it('should handle custom domain login host', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://mycompany.my.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.loginHost).toBe('https://mycompany.my.salesforce.com');
    });
  });

  describe('execute() - Return Value', () => {
    it('should return project path in result', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      const expectedResult = {
        projectPath: '/Users/dev/TestApp',
      };

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, expectedResult);

      const result = node.execute(inputState);

      expect(result).toEqual(expectedResult);
      expect(result.projectPath).toBe('/Users/dev/TestApp');
    });

    it('should return validated result from tool executor', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      const expectedResult = {
        projectPath: '/path/to/project',
      };

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, expectedResult);

      const result = node.execute(inputState);

      expect(result).toEqual(expectedResult);
    });

    it('should return partial state object', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('execute() - Logging', () => {
    it('should log tool invocation details', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
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
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
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
    it('should only use required fields from state', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
        // Other state properties that should not be passed
        buildType: 'debug',
        targetDevice: 'iPhone 15',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input).toHaveProperty('selectedTemplate');
      expect(lastCall?.input).toHaveProperty('projectName');
      expect(lastCall?.input).toHaveProperty('platform');
      expect(lastCall?.input).toHaveProperty('packageName');
      expect(lastCall?.input).toHaveProperty('organization');
      expect(lastCall?.input).toHaveProperty('connectedAppClientId');
      expect(lastCall?.input).toHaveProperty('connectedAppCallbackUri');
      expect(lastCall?.input).toHaveProperty('loginHost');
      expect(lastCall?.input).not.toHaveProperty('buildType');
      expect(lastCall?.input).not.toHaveProperty('targetDevice');
    });

    it('should not modify input state', () => {
      const originalTemplate = 'iOSNativeSwiftTemplate';
      const originalProjectName = 'TestApp';

      const inputState = createTestState({
        selectedTemplate: originalTemplate,
        projectName: originalProjectName,
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      expect(inputState.selectedTemplate).toBe(originalTemplate);
      expect(inputState.projectName).toBe(originalProjectName);
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle Contact List app iOS generation', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'ContactListApp',
        platform: 'iOS',
        packageName: 'com.salesforce.contactlist',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9Kip4IKAZQEXPNwTYYd.example',
        connectedAppCallbackUri: 'contactlist://oauth/callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/Users/developer/ContactListApp-iOS',
      });

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      expect(result.projectPath).toBe('/Users/developer/ContactListApp-iOS');

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectName).toBe('ContactListApp');
      expect(lastCall?.llmMetadata.name).toBe('sfmobile-native-project-generation');
    });

    it('should handle Contact List app Android generation', () => {
      const inputState = createTestState({
        selectedTemplate: 'AndroidNativeKotlinTemplate',
        projectName: 'ContactListApp',
        platform: 'Android',
        packageName: 'com.salesforce.contactlist',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9Kip4IKAZQEXPNwTYYd.example',
        connectedAppCallbackUri: 'contactlist://oauth/callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/home/developer/ContactListApp-Android',
      });

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      expect(result.projectPath).toBe('/home/developer/ContactListApp-Android');
    });

    it('should handle generation after template discovery', () => {
      const inputState = createTestState({
        selectedTemplate: 'MobileSyncExplorerSwift',
        projectName: 'SyncExplorer',
        platform: 'iOS',
        packageName: 'com.salesforce.syncexplorer',
        organization: 'Salesforce',
        connectedAppClientId: '3MVG9test',
        connectedAppCallbackUri: 'syncexplorer://oauth',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/Users/dev/SyncExplorer',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.selectedTemplate).toBe('MobileSyncExplorerSwift');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle project names with special characters', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'My-App_v2.0',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.projectName).toBe('My-App_v2.0');
    });

    it('should handle organization names with spaces', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'Acme Corporation Inc.',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app://callback',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.organization).toBe('Acme Corporation Inc.');
    });

    it('should handle callback URIs with query parameters', () => {
      const inputState = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'TestApp',
        platform: 'iOS',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://oauth/callback?param=value',
        loginHost: 'https://login.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.connectedAppCallbackUri).toBe('myapp://oauth/callback?param=value');
    });
  });

  describe('execute() - Multiple Invocations', () => {
    it('should handle multiple sequential invocations', () => {
      const state1 = createTestState({
        selectedTemplate: 'iOSNativeSwiftTemplate',
        projectName: 'App1',
        platform: 'iOS',
        packageName: 'com.test.app1',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'app1://callback',
        loginHost: 'https://login.salesforce.com',
      });

      const state2 = createTestState({
        selectedTemplate: 'AndroidNativeKotlinTemplate',
        projectName: 'App2',
        platform: 'Android',
        packageName: 'com.test.app2',
        organization: 'TestOrg',
        connectedAppClientId: 'client456',
        connectedAppCallbackUri: 'app2://callback',
        loginHost: 'https://test.salesforce.com',
      });

      mockToolExecutor.setResult(PROJECT_GENERATION_TOOL.toolId, {
        projectPath: '/path/to/project',
      });

      node.execute(state1);
      const call1 = mockToolExecutor.getLastCall();

      node.execute(state2);
      const call2 = mockToolExecutor.getLastCall();

      expect(call1?.input.projectName).toBe('App1');
      expect(call1?.input.platform).toBe('iOS');
      expect(call2?.input.projectName).toBe('App2');
      expect(call2?.input.platform).toBe('Android');
    });
  });
});
