/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import z from 'zod';
import { GetInputService } from '../../../src/workflow/services/getInputService.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { GET_INPUT_TOOL } from '../../../src/tools/plan/sfmobile-native-get-input/metadata.js';

describe('GetInputService', () => {
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;
  let service: GetInputService;

  beforeEach(() => {
    mockToolExecutor = new MockToolExecutor();
    mockLogger = new MockLogger();
    service = new GetInputService(mockToolExecutor, mockLogger);
  });

  describe('Constructor', () => {
    it('should use provided tool executor', () => {
      expect(service['toolExecutor']).toBe(mockToolExecutor);
    });

    it('should use provided logger', () => {
      expect(service['logger']).toBe(mockLogger);
    });

    it('should create default dependencies when none provided', () => {
      const serviceWithDefaults = new GetInputService();
      expect(serviceWithDefaults['toolExecutor']).toBeDefined();
      expect(serviceWithDefaults['logger']).toBeDefined();
    });
  });

  describe('getInput - Successful Retrieval', () => {
    it('should get user input for a question', () => {
      const question = 'What is your mobile platform?';
      const expectedInput = 'iOS';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: expectedInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(expectedInput);
    });

    it('should call tool executor with correct parameters', () => {
      const question = 'What is your project name?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'MyApp',
      });

      service.getInput(question);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.llmMetadata.name).toBe(GET_INPUT_TOOL.toolId);
      expect(lastCall?.llmMetadata.description).toBe(GET_INPUT_TOOL.description);
      expect(lastCall?.input).toHaveProperty('question', question);
    });

    it('should pass question correctly to tool', () => {
      const question = 'What is your package identifier?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'com.example.app',
      });

      service.getInput(question);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.question).toBe(question);
    });

    it('should return string user input', () => {
      const question = 'What is your platform?';
      const userInput = 'Android';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
      expect(typeof result).toBe('string');
    });

    it('should return numeric user input', () => {
      const question = 'What version number?';
      const userInput = 42;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
      expect(typeof result).toBe('number');
    });

    it('should return boolean user input', () => {
      const question = 'Enable offline mode?';
      const userInput = true;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
      expect(typeof result).toBe('boolean');
    });

    it('should return object user input', () => {
      const question = 'Provide your settings?';
      const userInput = { platform: 'iOS', offline: true };

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toEqual(userInput);
    });

    it('should return array user input', () => {
      const question = 'List your platforms?';
      const userInput = ['iOS', 'Android'];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toEqual(userInput);
    });

    it('should return null user input', () => {
      const question = 'Optional description?';
      const userInput = null;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBeNull();
    });
  });

  describe('getInput - Various Question Types', () => {
    it('should handle simple questions', () => {
      const question = 'Platform?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      const result = service.getInput(question);

      expect(result).toBe('iOS');
    });

    it('should handle questions with format hints', () => {
      const question = 'Release date (YYYY-MM-DD)?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: '2025-10-06',
      });

      const result = service.getInput(question);

      expect(result).toBe('2025-10-06');
    });

    it('should handle questions with examples', () => {
      const question = 'Package name (e.g., com.company.app)?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'com.example.myapp',
      });

      const result = service.getInput(question);

      expect(result).toBe('com.example.myapp');
    });

    it('should handle multi-line questions', () => {
      const question = 'What is your platform?\nChoose iOS or Android.';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      const result = service.getInput(question);

      expect(result).toBe('iOS');
    });

    it('should handle empty string question', () => {
      const question = '';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'some input',
      });

      const result = service.getInput(question);

      expect(result).toBe('some input');
    });
  });

  describe('getInput - Error Handling', () => {
    it('should throw if tool result is not an object', () => {
      const question = 'What is your platform?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, 'invalid');

      expect(() => {
        service.getInput(question);
      }).toThrow(z.ZodError);
    });

    it('should allow any type for userUtterance', () => {
      const question = 'Input?';

      // All of these should be valid
      const testCases = ['string', 123, true, false, null, undefined, { key: 'value' }, ['array']];

      testCases.forEach(testCase => {
        mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
          userUtterance: testCase,
        });

        expect(() => {
          service.getInput(question);
        }).not.toThrow();
      });
    });
  });

  describe('getInput - Logging', () => {
    it('should log input request start', () => {
      const question = 'What is your platform?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      mockLogger.reset();
      service.getInput(question);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const startLog = debugLogs.find(log => log.message.includes('Starting input request'));

      expect(startLog).toBeDefined();
      expect(startLog?.data).toMatchObject({
        question,
      });
    });

    it('should log tool invocation', () => {
      const question = 'What is your project name?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'MyApp',
      });

      mockLogger.reset();
      service.getInput(question);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const invocationLog = debugLogs.find(log =>
        log.message.includes('Tool invocation data (pre-execution)')
      );

      expect(invocationLog).toBeDefined();
      expect(invocationLog?.data).toHaveProperty('toolInvocationData');
    });

    it('should log tool execution completion', () => {
      const question = 'What is your platform?';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      mockLogger.reset();
      service.getInput(question);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const executionLog = debugLogs.find(log =>
        log.message.includes('Tool execution result (post-execution)')
      );

      expect(executionLog).toBeDefined();
      expect(executionLog?.data).toHaveProperty('result');
    });
  });

  describe('getInput - Real World Scenarios', () => {
    it('should handle platform selection', () => {
      const question = 'What is your mobile platform?';
      const userInput = 'iOS';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle project name input', () => {
      const question = 'What is your project name?';
      const userInput = 'MyAwesomeApp';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle package identifier input', () => {
      const question = 'What is the package identifier for your app?';
      const userInput = 'com.example.myapp';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle Salesforce Connected App Consumer Key', () => {
      const question = 'What is your Salesforce Connected App Consumer Key?';
      const userInput = 'ABC123XYZ789';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle callback URI input', () => {
      const question = 'What is your Connected App Callback URL?';
      const userInput = 'myapp://oauth/callback';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle login host input', () => {
      const question = 'What is your Salesforce login host?';
      const userInput = 'login.salesforce.com';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle boolean configuration questions', () => {
      const question = 'Would you like to enable offline capabilities?';
      const userInput = true;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(true);
    });

    it('should handle numeric inputs', () => {
      const question = 'What version number would you like to use?';
      const userInput = 1.5;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(1.5);
    });

    it('should handle complex structured input', () => {
      const question = 'Provide your OAuth configuration?';
      const userInput = {
        clientId: 'ABC123',
        callbackUri: 'myapp://oauth',
        scopes: ['api', 'refresh_token'],
      };

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toEqual(userInput);
    });

    it('should handle multiple sequential input requests', () => {
      // First input
      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });
      const result1 = service.getInput('What is your platform?');

      // Second input
      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'MyApp',
      });
      const result2 = service.getInput('What is your project name?');

      // Third input
      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'com.example.myapp',
      });
      const result3 = service.getInput('What is your package identifier?');

      expect(result1).toBe('iOS');
      expect(result2).toBe('MyApp');
      expect(result3).toBe('com.example.myapp');
      expect(mockToolExecutor.getCallHistory()).toHaveLength(3);
    });
  });

  describe('getInput - Edge Cases', () => {
    it('should handle empty string input', () => {
      const question = 'Optional description?';
      const userInput = '';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const question = 'Input?';
      const userInput = '   ';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe('   ');
    });

    it('should handle very long input', () => {
      const question = 'Describe your app?';
      const userInput = 'A'.repeat(10000);

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
      expect((result as string).length).toBe(10000);
    });

    it('should handle input with special characters', () => {
      const question = 'Input?';
      const userInput = 'Test\'s "quoted" value & special <chars>';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle input with unicode characters', () => {
      const question = 'Project name?';
      const userInput = 'My App 🚀📱';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });

    it('should handle undefined input', () => {
      const question = 'Input?';
      const userInput = undefined;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBeUndefined();
    });

    it('should handle deeply nested object input', () => {
      const question = 'Config?';
      const userInput = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toEqual(userInput);
    });
  });

  describe('getInput - Integration Scenarios', () => {
    it('should work with question generated by GenerateQuestionService', () => {
      // Simulates the output from GenerateQuestionService
      const generatedQuestion = 'What is your mobile platform?';
      const userInput = 'iOS';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(generatedQuestion);

      expect(result).toBe(userInput);
    });

    it('should handle questions with rich formatting', () => {
      const question =
        'What is your Callback URL?\n\n' +
        'Format: scheme://path\n' +
        'Example: myapp://oauth/callback\n\n' +
        'Note: This must match your Connected App configuration.';

      const userInput = 'salesforceapp://oauth/callback';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(question);

      expect(result).toBe(userInput);
    });
  });
});
