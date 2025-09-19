/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SfmobileNativeProjectGenerationTool } from '../../../../src/tools/plan/sfmobile-native-project-generation/tool.js';

// Mock the constants module to provide consistent paths for snapshots
vi.mock('../../../../src/constants.js', () => ({
  MOBILE_SDK_TEMPLATES_PATH: './templates',
}));

describe('SfmobileNativeProjectGenerationTool', () => {
  let tool: SfmobileNativeProjectGenerationTool;

  beforeEach(() => {
    const mockServer = {
      registerTool: vi.fn(),
    };
    tool = new SfmobileNativeProjectGenerationTool(mockServer as any);
  });

  it('should have correct tool properties', () => {
    expect(tool.toolMetadata.toolId).toBe('sfmobile-native-project-generation');
    expect(tool.toolMetadata.title).toBe('Salesforce Mobile Native Project Generation');
    expect(tool.toolMetadata.description).toBe(
      'Provides LLM instructions for generating a mobile app project from a selected template with OAuth configuration'
    );
  });

  it('should have input schema with required fields', () => {
    const schema = tool.toolMetadata.inputSchema;
    expect(schema).toBeDefined();
    expect(schema.shape).toBeDefined();
    expect(schema.shape.selectedTemplate).toBeDefined();
    expect(schema.shape.projectName).toBeDefined();
    expect(schema.shape.platform).toBeDefined();
    expect(schema.shape.packageName).toBeDefined();
    expect(schema.shape.organization).toBeDefined();
    expect(schema.shape.connectedAppClientId).toBeDefined();
    expect(schema.shape.connectedAppCallbackUri).toBeDefined();
    expect(schema.shape.loginHost).toBeDefined();
  });

  it('should register with MCP server with correct annotations', () => {
    const mockServer = {
      registerTool: vi.fn(),
    };
    const mockAnnotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
    const projectTool = new SfmobileNativeProjectGenerationTool(mockServer as any);

    projectTool.register(mockAnnotations);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'sfmobile-native-project-generation',
      expect.objectContaining({
        description:
          'Provides LLM instructions for generating a mobile app project from a selected template with OAuth configuration',
        inputSchema: expect.any(Object),
        outputSchema: expect.any(Object),
        title: 'Salesforce Mobile Native Project Generation',
      }),
      expect.any(Function)
    );
  });

  it('should generate guidance for iOS platform', async () => {
    const input = {
      selectedTemplate: 'MobileSyncExplorerSwift',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'testapp://oauth/callback',
      loginHost: 'https://test.salesforce.com',
    };

    const result = await (tool as any).handleRequest(input);

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains expected iOS guidance content
    expect(workflowOutput.promptForLLM).toContain('Mobile App Project Generation Guide');
    expect(workflowOutput.promptForLLM).toContain('MobileSyncExplorerSwift');
    expect(workflowOutput.promptForLLM).toContain('iOS');
    expect(workflowOutput.promptForLLM).toContain('bootconfig.plist');
    expect(workflowOutput.promptForLLM).toContain('https://test.salesforce.com');

    // Verify the result schema defines projectPath
    const resultSchema = JSON.parse(workflowOutput.resultSchema);
    expect(resultSchema.type).toBe('object');
    expect(resultSchema.properties).toHaveProperty('projectPath');
    expect(resultSchema.properties.projectPath.type).toBe('string');
    expect(resultSchema.required).toContain('projectPath');
  });

  it('should generate guidance for Android platform', async () => {
    const input = {
      selectedTemplate: 'MobileSyncExplorerKotlin',
      projectName: 'TestAndroidApp',
      platform: 'Android' as const,
      packageName: 'com.test.androidapp',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9android123',
      connectedAppCallbackUri: 'androidapp://oauth/callback',
    };

    const result = await (tool as any).handleRequest(input);

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains expected Android guidance content
    expect(workflowOutput.promptForLLM).toContain('Mobile App Project Generation Guide');
    expect(workflowOutput.promptForLLM).toContain('MobileSyncExplorerKotlin');
    expect(workflowOutput.promptForLLM).toContain('Android');
    expect(workflowOutput.promptForLLM).toContain('bootconfig.xml');
    expect(workflowOutput.promptForLLM).toContain('AndroidManifest.xml');

    // Verify the result schema defines projectPath
    const resultSchema = JSON.parse(workflowOutput.resultSchema);
    expect(resultSchema.type).toBe('object');
    expect(resultSchema.properties).toHaveProperty('projectPath');
    expect(resultSchema.properties.projectPath.type).toBe('string');
    expect(resultSchema.required).toContain('projectPath');
  });

  it('should handle optional loginHost parameter', async () => {
    const inputWithoutLoginHost = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'testapp://oauth/callback',
    };

    const result = await (tool as any).handleRequest(inputWithoutLoginHost);

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify default loginHost behavior when not provided
    expect(workflowOutput.promptForLLM).toContain('Default (production)');
    expect(workflowOutput.promptForLLM).toContain('TestTemplate');
    expect(workflowOutput.promptForLLM).toContain('TestApp');
  });

  it('should include build validation integration', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'testapp://oauth/callback',
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output and verify structure
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains expected content
    expect(workflowOutput.promptForLLM).toContain('Mobile App Project Generation Guide');
    expect(workflowOutput.promptForLLM).toContain('TestTemplate');
    expect(workflowOutput.promptForLLM).toContain('TestApp');
  });

  it('should handle errors gracefully', async () => {
    // Mock the generateProjectGenerationGuidance to throw an error

    const originalMethod = (tool as any).generateProjectGenerationGuidance;

    (tool as any).generateProjectGenerationGuidance = () => {
      throw new Error('Test error');
    };

    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'testapp://oauth/callback',
    };

    const result = await (tool as any).handleRequest(input);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Test error');

    // Restore original method

    (tool as any).generateProjectGenerationGuidance = originalMethod;
  });

  it('should extract URL scheme from callback URI for iOS', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'customscheme://oauth/callback',
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains expected iOS scheme extraction
    expect(workflowOutput.promptForLLM).toContain('customscheme');
    expect(workflowOutput.promptForLLM).toContain('iOS');
  });

  it('should extract URL scheme from callback URI for Android', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'Android' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'customscheme://oauth/callback',
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains expected Android scheme extraction
    expect(workflowOutput.promptForLLM).toContain('customscheme');
    expect(workflowOutput.promptForLLM).toContain('Android');
  });

  it('should handle missing callback URI with fallback scheme for iOS', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: undefined,
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains the fallback scheme
    expect(workflowOutput.promptForLLM).toContain('myapp');
  });

  it('should handle missing callback URI with fallback scheme for Android', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'Android' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: undefined,
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify the prompt contains the fallback scheme
    expect(workflowOutput.promptForLLM).toContain('myapp');
  });

  it('should handle Android platform with loginHost', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'Android' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'testapp://oauth/callback',
      loginHost: 'https://custom.salesforce.com',
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify Android-specific content with custom login host
    expect(workflowOutput.promptForLLM).toContain('oauthLoginDomain');
    expect(workflowOutput.promptForLLM).toContain('https://custom.salesforce.com');
  });

  it('should handle non-Error exception in error handling', async () => {
    // Mock the generateProjectGenerationGuidance to throw a non-Error object

    const originalMethod = (tool as any).generateProjectGenerationGuidance;

    (tool as any).generateProjectGenerationGuidance = () => {
      throw 'String error'; // Non-Error object
    };

    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: '3MVG9test123',
      connectedAppCallbackUri: 'testapp://oauth/callback',
    };

    const result = await (tool as any).handleRequest(input);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Unknown error occurred');

    // Restore original method

    (tool as any).generateProjectGenerationGuidance = originalMethod;
  });

  it('should handle missing client ID and callback URI in verification commands', async () => {
    const input = {
      selectedTemplate: 'TestTemplate',
      projectName: 'TestApp',
      platform: 'iOS' as const,
      packageName: 'com.test.app',
      organization: 'Test Org',
      connectedAppClientId: undefined,
      connectedAppCallbackUri: undefined,
    };

    const result = await (tool as any).handleRequest(input);

    // Parse the structured workflow output
    const workflowOutput = JSON.parse(result.content[0].text);
    expect(workflowOutput).toHaveProperty('promptForLLM');
    expect(workflowOutput).toHaveProperty('resultSchema');

    // Verify fallback verification commands for missing credentials
    expect(workflowOutput.promptForLLM).toContain('CLIENT_ID');
    expect(workflowOutput.promptForLLM).toContain('CALLBACK');
  });
});
