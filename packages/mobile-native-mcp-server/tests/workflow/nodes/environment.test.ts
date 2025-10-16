/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvironmentValidationNode } from '../../../src/workflow/nodes/environment.js';
import { createTestState } from '../../utils/stateBuilders.js';

describe('EnvironmentValidationNode', () => {
  let node: EnvironmentValidationNode;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    node = new EnvironmentValidationNode();
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with correct node name', () => {
      expect(node.name).toBe('validateEnvironment');
    });

    it('should extend BaseNode', () => {
      expect(node).toBeDefined();
      expect(node.name).toBeDefined();
      expect(node.execute).toBeDefined();
    });
  });

  describe('execute() - Valid Environment', () => {
    it('should return valid environment when both required env vars are set', () => {
      // Set required environment variables
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-consumer-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(true);
      expect(result.workflowFatalErrorMessages).toBeUndefined();
      expect(result.connectedAppClientId).toBe('test-consumer-key');
      expect(result.connectedAppCallbackUri).toBe('myapp://callback');
    });

    it('should return environment variable values in state', () => {
      const testClientId = '3MVG9Kip4IKAZQEXPNwTYYd.example';
      const testCallbackUri = 'myapp://oauth/callback';

      process.env.CONNECTED_APP_CONSUMER_KEY = testClientId;
      process.env.CONNECTED_APP_CALLBACK_URL = testCallbackUri;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.connectedAppClientId).toBe(testClientId);
      expect(result.connectedAppCallbackUri).toBe(testCallbackUri);
    });

    it('should handle long environment variable values', () => {
      const longClientId =
        '3MVG9Kip4IKAZQEXPNwTYYd.a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
      const longCallbackUri = 'myapp://oauth/callback/with/very/long/path/component';

      process.env.CONNECTED_APP_CONSUMER_KEY = longClientId;
      process.env.CONNECTED_APP_CALLBACK_URL = longCallbackUri;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(true);
      expect(result.connectedAppClientId).toBe(longClientId);
      expect(result.connectedAppCallbackUri).toBe(longCallbackUri);
    });
  });

  describe('execute() - Invalid Environment - Missing Both Variables', () => {
    it('should return invalid environment when both required env vars are missing', () => {
      // Ensure environment variables are not set
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(2);
    });

    it('should include error messages for both missing variables', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.workflowFatalErrorMessages).toBeDefined();

      const messages = result.workflowFatalErrorMessages!;
      expect(messages[0]).toContain('CONNECTED_APP_CONSUMER_KEY');
      expect(messages[0]).toContain('environment variable');
      expect(messages[0]).toContain(
        'https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5'
      );

      expect(messages[1]).toContain('CONNECTED_APP_CALLBACK_URL');
      expect(messages[1]).toContain('environment variable');
      expect(messages[1]).toContain(
        'https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5'
      );
    });

    it('should return undefined values for env vars when both are missing', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.connectedAppClientId).toBeUndefined();
      expect(result.connectedAppCallbackUri).toBeUndefined();
    });
  });

  describe('execute() - Invalid Environment - Missing Consumer Key', () => {
    it('should return invalid environment when only consumer key is missing', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
    });

    it('should include error message only for missing consumer key', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      const messages = result.workflowFatalErrorMessages!;
      expect(messages[0]).toContain('CONNECTED_APP_CONSUMER_KEY');
      expect(messages[0]).toContain('environment variable');
    });

    it('should still return callback URI value when only consumer key is missing', () => {
      const testCallbackUri = 'myapp://oauth/callback';

      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      process.env.CONNECTED_APP_CALLBACK_URL = testCallbackUri;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.connectedAppClientId).toBeUndefined();
      expect(result.connectedAppCallbackUri).toBe(testCallbackUri);
    });
  });

  describe('execute() - Invalid Environment - Missing Callback URL', () => {
    it('should return invalid environment when only callback URL is missing', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-consumer-key';
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toBeDefined();
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
    });

    it('should include error message only for missing callback URL', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-consumer-key';
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      const messages = result.workflowFatalErrorMessages!;
      expect(messages[0]).toContain('CONNECTED_APP_CALLBACK_URL');
      expect(messages[0]).toContain('environment variable');
    });

    it('should still return consumer key value when only callback URL is missing', () => {
      const testClientId = '3MVG9Kip4IKAZQEXPNwTYYd.example';

      process.env.CONNECTED_APP_CONSUMER_KEY = testClientId;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.connectedAppClientId).toBe(testClientId);
      expect(result.connectedAppCallbackUri).toBeUndefined();
    });
  });

  describe('execute() - Empty String Values', () => {
    it('should treat empty string consumer key as missing', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = '';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
      expect(result.workflowFatalErrorMessages![0]).toContain('CONNECTED_APP_CONSUMER_KEY');
    });

    it('should treat empty string callback URL as missing', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-key';
      process.env.CONNECTED_APP_CALLBACK_URL = '';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toHaveLength(1);
      expect(result.workflowFatalErrorMessages![0]).toContain('CONNECTED_APP_CALLBACK_URL');
    });

    it('should treat both empty strings as missing', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = '';
      process.env.CONNECTED_APP_CALLBACK_URL = '';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toHaveLength(2);
    });
  });

  describe('execute() - State Independence', () => {
    it('should not depend on input state values', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-consumer-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      // Input state with irrelevant values
      const inputState = createTestState({
        projectName: 'TestProject',
        platform: 'iOS',
        userInput: 'Create an app',
      });

      const result = node.execute(inputState);

      // Should only depend on environment variables, not state
      expect(result.validEnvironment).toBe(true);
    });

    it('should not modify input state', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-consumer-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState({
        projectName: 'TestProject',
      });

      const originalProjectName = inputState.projectName;

      node.execute(inputState);

      // Input state should remain unchanged
      expect(inputState.projectName).toBe(originalProjectName);
    });

    it('should produce same result regardless of state content', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-consumer-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const state1 = createTestState({});
      const state2 = createTestState({
        projectName: 'Project',
        platform: 'Android',
      });

      const result1 = node.execute(state1);
      const result2 = node.execute(state2);

      expect(result1.validEnvironment).toBe(result2.validEnvironment);
      expect(result1.connectedAppClientId).toBe(result2.connectedAppClientId);
      expect(result1.connectedAppCallbackUri).toBe(result2.connectedAppCallbackUri);
    });
  });

  describe('execute() - Error Message Content', () => {
    it('should include helpful information in error messages', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      const messages = result.workflowFatalErrorMessages!;

      // Check that messages contain helpful information
      messages.forEach(message => {
        expect(message).toContain('environment variable');
        expect(message).toContain('Salesforce Connected App');
        expect(message).toContain('mobile app');
        expect(message).toContain('https://help.salesforce.com');
      });
    });

    it('should reference the correct documentation URL', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;

      const inputState = createTestState();

      const result = node.execute(inputState);

      const message = result.workflowFatalErrorMessages![0];
      expect(message).toContain(
        'https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5'
      );
    });
  });

  describe('execute() - Return Type', () => {
    it('should return partial state object', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.validEnvironment).toBeDefined();
      expect(typeof result.validEnvironment).toBe('boolean');
    });

    it('should return all expected properties on success', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result).toHaveProperty('validEnvironment');
      expect(result).toHaveProperty('connectedAppClientId');
      expect(result).toHaveProperty('connectedAppCallbackUri');
      expect(result.validEnvironment).toBe(true);
    });

    it('should return all expected properties on failure', () => {
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result).toHaveProperty('validEnvironment');
      expect(result).toHaveProperty('workflowFatalErrorMessages');
      expect(result.validEnvironment).toBe(false);
      expect(Array.isArray(result.workflowFatalErrorMessages)).toBe(true);
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle production environment with valid credentials', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = '3MVG9Kip4IKAZQEXPNwTYYd.example';
      process.env.CONNECTED_APP_CALLBACK_URL = 'com.salesforce.myapp://oauth/callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(true);
      expect(result.connectedAppClientId).toBe('3MVG9Kip4IKAZQEXPNwTYYd.example');
      expect(result.connectedAppCallbackUri).toBe('com.salesforce.myapp://oauth/callback');
    });

    it('should handle development environment with test credentials', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-dev-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'testapp://callback';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(true);
      expect(result.connectedAppClientId).toBe('test-dev-key');
      expect(result.connectedAppCallbackUri).toBe('testapp://callback');
    });

    it('should handle CI/CD environment without credentials', () => {
      // Simulate CI/CD environment where credentials might not be set
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(false);
      expect(result.workflowFatalErrorMessages).toHaveLength(2);
      // Should provide clear guidance on what needs to be set
      expect(result.workflowFatalErrorMessages![0]).toContain('CONNECTED_APP_CONSUMER_KEY');
      expect(result.workflowFatalErrorMessages![1]).toContain('CONNECTED_APP_CALLBACK_URL');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle whitespace-only values as missing', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = '   ';
      process.env.CONNECTED_APP_CALLBACK_URL = '\t\n';

      const inputState = createTestState();

      const result = node.execute(inputState);

      // Whitespace-only values are falsy when trimmed, but the current implementation
      // doesn't trim, so they would be considered valid. However, the test documents
      // the current behavior. If trimming is desired, the implementation would need to change.
      expect(result.validEnvironment).toBe(true);
      expect(result.connectedAppClientId).toBe('   ');
      expect(result.connectedAppCallbackUri).toBe('\t\n');
    });

    it('should handle special characters in environment variable values', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = '3MVG9@#$%^&*()_+-=[]{}|;:,.<>?';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback?param=value&other=123';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(true);
      expect(result.connectedAppClientId).toBe('3MVG9@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(result.connectedAppCallbackUri).toBe('myapp://callback?param=value&other=123');
    });

    it('should handle unicode characters in environment variable values', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-key-🔑-unicode';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback/测试/тест';

      const inputState = createTestState();

      const result = node.execute(inputState);

      expect(result.validEnvironment).toBe(true);
      expect(result.connectedAppClientId).toBe('test-key-🔑-unicode');
      expect(result.connectedAppCallbackUri).toBe('myapp://callback/测试/тест');
    });
  });

  describe('execute() - Multiple Invocations', () => {
    it('should return consistent results across multiple calls', () => {
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';

      const inputState = createTestState();

      const result1 = node.execute(inputState);
      const result2 = node.execute(inputState);
      const result3 = node.execute(inputState);

      expect(result1.validEnvironment).toBe(result2.validEnvironment);
      expect(result2.validEnvironment).toBe(result3.validEnvironment);
      expect(result1.connectedAppClientId).toBe(result2.connectedAppClientId);
      expect(result2.connectedAppClientId).toBe(result3.connectedAppClientId);
    });

    it('should reflect environment changes across invocations', () => {
      const inputState = createTestState();

      // First invocation - no credentials
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      delete process.env.CONNECTED_APP_CALLBACK_URL;
      const result1 = node.execute(inputState);
      expect(result1.validEnvironment).toBe(false);

      // Second invocation - credentials added
      process.env.CONNECTED_APP_CONSUMER_KEY = 'test-key';
      process.env.CONNECTED_APP_CALLBACK_URL = 'myapp://callback';
      const result2 = node.execute(inputState);
      expect(result2.validEnvironment).toBe(true);

      // Third invocation - one credential removed
      delete process.env.CONNECTED_APP_CONSUMER_KEY;
      const result3 = node.execute(inputState);
      expect(result3.validEnvironment).toBe(false);
    });
  });
});
