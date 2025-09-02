/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SfmobileNativeBuildTool } from '../../../../src/tools/plan/sfmobile-native-build/tool.js';

describe('SfmobileNativeBuildTool', () => {
  let tool: SfmobileNativeBuildTool;

  beforeEach(() => {
    tool = new SfmobileNativeBuildTool();
  });

  it('should have correct tool properties', () => {
    expect(tool.name).toBe('Salesforce Mobile App Build Tool');
    expect(tool.title).toBe('Salesforce Mobile app build guide');
    expect(tool.toolId).toBe('sfmobile-native-build');
    expect(tool.description).toBe(
      'Guides LLM through the process of building a Salesforce mobile app with target platform'
    );
  });

  it('should have input schema with required platform and projectPath fields', () => {
    const schema = tool.inputSchema;
    expect(schema).toBeDefined();
    expect(schema.shape).toBeDefined();
    expect(schema.shape.platform).toBeDefined();
    expect(schema.shape.projectPath).toBeDefined();
  });

  it('should register with MCP server', () => {
    const mockServer = {
      tool: vi.fn(),
    };
    const mockAnnotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };

    tool.register(
      mockServer as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
      mockAnnotations
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'sfmobile-native-build',
      'Guides LLM through the process of building a Salesforce mobile app with target platform',
      expect.any(Object),
      expect.objectContaining({
        ...mockAnnotations,
        title: 'Salesforce Mobile app build guide',
      }),
      expect.any(Function)
    );
  });

  it('should generate iOS build guidance', async () => {
    const input = { platform: 'iOS' as const, projectPath: '/path/to/ios/project' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (tool as any).handleRequest(input);

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const guidance = result.content[0].text;

    // Check main title
    expect(guidance).toContain('Salesforce Mobile App Build Guidance for iOS');
    
    // Check environment check step
    expect(guidance).toContain('Step 1: Environment Check');
    expect(guidance).toContain('sf force lightning local setup -p=ios -l=17.0.1');
    expect(guidance).toContain('PASSED');
    expect(guidance).toContain('FAILED');
    
    // Check iOS build execution step
    expect(guidance).toContain('Step 2: iOS Build Execution');
    expect(guidance).toContain('Navigate to the /path/to/ios/project directory');
    expect(guidance).toContain('xcodebuild -workspace');
    expect(guidance).toContain('<your-workspace>.xcworkspace');
    expect(guidance).toContain('<your-scheme>');
    expect(guidance).toContain('<simulator-destination>');
    expect(guidance).toContain('BUILD SUCCEEDED');
    expect(guidance).toContain('iOS 17.0 or greater');
    
    // Check next steps
    expect(guidance).toContain('Next Steps');
    expect(guidance).toContain('sfmobile-native-deployment');
  });

  it('should generate Android build guidance', async () => {
    const input = { platform: 'Android' as const, projectPath: '/path/to/android/project' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (tool as any).handleRequest(input);

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const guidance = result.content[0].text;

    // Check main title
    expect(guidance).toContain('Salesforce Mobile App Build Guidance for Android');
    
    // Check environment check step
    expect(guidance).toContain('Step 1: Environment Check');
    expect(guidance).toContain('sf force lightning local setup -p=android -l=35');
    expect(guidance).toContain('PASSED');
    expect(guidance).toContain('FAILED');
    
    // Check Android build execution step
    expect(guidance).toContain('Step 2: Android Build Execution');
    expect(guidance).toContain('Navigate to the /path/to/android/project directory');
    expect(guidance).toContain('./gradlew build');
    expect(guidance).toContain('BUILD SUCCESSFUL');
    expect(guidance).toContain('FAILURE:Build failed');
    
    // Check next steps
    expect(guidance).toContain('Next Steps');
    expect(guidance).toContain('sfmobile-native-deployment');
  });

  it('should include project path in iOS build guidance', async () => {
    const customPath = '/custom/ios/project/path';
    const input = { platform: 'iOS' as const, projectPath: customPath };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (tool as any).handleRequest(input);

    expect(result.content[0].text).toContain(`Navigate to the ${customPath} directory`);
  });

  it('should include project path in Android build guidance', async () => {
    const customPath = '/custom/android/project/path';
    const input = { platform: 'Android' as const, projectPath: customPath };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (tool as any).handleRequest(input);

    expect(result.content[0].text).toContain(`Navigate to the ${customPath} directory`);
  });

  it('should use correct API levels for each platform', async () => {
    // Test iOS API level
    const iOSInput = { platform: 'iOS' as const, projectPath: '/ios/path' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iOSResult = await (tool as any).handleRequest(iOSInput);
    expect(iOSResult.content[0].text).toContain('-l=17.0.1');

    // Test Android API level
    const androidInput = { platform: 'Android' as const, projectPath: '/android/path' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const androidResult = await (tool as any).handleRequest(androidInput);
    expect(androidResult.content[0].text).toContain('-l=35');
  });

  it('should include proper formatting and structure', async () => {
    const input = { platform: 'iOS' as const, projectPath: '/test/path' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (tool as any).handleRequest(input);

    const guidance = result.content[0].text;
    
    // Check that it has proper markdown structure
    expect(guidance).toContain('##');
    expect(guidance).toContain('```bash');
    expect(guidance).toContain('**BUILD SUCCEEDED**');
    expect(guidance).toContain('You MUST follow the steps in this guide in order');
  });

  it('should handle empty project path', async () => {
    const input = { platform: 'Android' as const, projectPath: '' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (tool as any).handleRequest(input);

    expect(result.content).toBeDefined();
    expect(result.content[0].text).toContain('Navigate to the  directory');
  });

  it('should test individual method behaviors', () => {
    // Test msdkEnvironmentCheck method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const envCheckResult = (tool as any).msdkEnvironmentCheck('iOS', '17.0.1');
    expect(envCheckResult).toContain('Step 1: Environment Check');
    expect(envCheckResult).toContain('sf force lightning local setup -p=ios -l=17.0.1');

    // Test msdkAppBuildExecutionIOS method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iOSBuildResult = (tool as any).msdkAppBuildExecutionIOS('/test/path');
    expect(iOSBuildResult).toContain('Step 2: iOS Build Execution');
    expect(iOSBuildResult).toContain('/test/path');
    expect(iOSBuildResult).toContain('xcodebuild');

    // Test msdkAppBuildExecutionAndroid method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const androidBuildResult = (tool as any).msdkAppBuildExecutionAndroid('/android/path');
    expect(androidBuildResult).toContain('Step 2: Android Build Execution');
    expect(androidBuildResult).toContain('/android/path');
    expect(androidBuildResult).toContain('./gradlew build');

    // Test generateNextStepsSection method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextStepsResult = (tool as any).generateNextStepsSection();
    expect(nextStepsResult).toContain('Next Steps');
    expect(nextStepsResult).toContain('sfmobile-native-deployment');
  });
});
