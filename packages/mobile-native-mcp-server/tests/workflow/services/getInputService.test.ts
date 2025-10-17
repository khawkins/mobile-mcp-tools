/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import z from 'zod';
import {
  GetInputProperty,
  GetInputService,
} from '../../../src/workflow/services/getInputService.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { GET_INPUT_TOOL } from '../../../src/tools/plan/sfmobile-native-get-input/metadata.js';

describe('GetInputService', () => {
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;
  let service: GetInputService;

  // Test property data
  const platformProperty: GetInputProperty = {
    propertyName: 'platform',
    friendlyName: 'mobile platform',
    description: 'Target mobile platform for the mobile app (iOS or Android)',
  };

  const projectNameProperty: GetInputProperty = {
    propertyName: 'projectName',
    friendlyName: 'project name',
    description: 'Name of the mobile application project',
  };

  const packageNameProperty: GetInputProperty = {
    propertyName: 'packageName',
    friendlyName: 'package identifier',
    description: 'The package identifier of the mobile app, for example com.company.appname',
  };

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
    it('should get user input for properties', () => {
      const properties = [platformProperty];
      const expectedInput = 'iOS';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: expectedInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(expectedInput);
    });

    it('should call tool executor with correct parameters', () => {
      const properties = [projectNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'MyApp',
      });

      service.getInput(properties);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.llmMetadata.name).toBe(GET_INPUT_TOOL.toolId);
      expect(lastCall?.llmMetadata.description).toBe(GET_INPUT_TOOL.description);
      expect(lastCall?.input).toHaveProperty('propertiesRequiringInput', properties);
    });

    it('should pass properties array correctly to tool', () => {
      const properties = [platformProperty, projectNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS and MyApp',
      });

      service.getInput(properties);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.propertiesRequiringInput).toEqual(properties);
    });

    it('should return string user input', () => {
      const properties = [platformProperty];
      const userInput = 'Android';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
      expect(typeof result).toBe('string');
    });

    it('should return numeric user input', () => {
      const properties = [projectNameProperty];
      const userInput = 42;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
      expect(typeof result).toBe('number');
    });

    it('should return boolean user input', () => {
      const properties = [platformProperty];
      const userInput = true;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
      expect(typeof result).toBe('boolean');
    });

    it('should return object user input', () => {
      const properties = [platformProperty, projectNameProperty];
      const userInput = { platform: 'iOS', projectName: 'MyApp' };

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toEqual(userInput);
    });

    it('should return array user input', () => {
      const properties = [platformProperty];
      const userInput = ['iOS', 'Android'];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toEqual(userInput);
    });

    it('should return null user input', () => {
      const properties = [projectNameProperty];
      const userInput = null;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBeNull();
    });
  });

  describe('getInput - Multiple Properties', () => {
    it('should handle single property', () => {
      const properties = [platformProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      const result = service.getInput(properties);

      expect(result).toBe('iOS');
    });

    it('should handle two properties', () => {
      const properties = [platformProperty, projectNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS and MyApp',
      });

      const result = service.getInput(properties);

      expect(result).toBe('iOS and MyApp');
    });

    it('should handle three properties', () => {
      const properties = [platformProperty, projectNameProperty, packageNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS, MyApp, com.test.myapp',
      });

      const result = service.getInput(properties);

      expect(result).toBe('iOS, MyApp, com.test.myapp');
    });

    it('should handle empty properties array', () => {
      const properties: GetInputProperty[] = [];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'some input',
      });

      const result = service.getInput(properties);

      expect(result).toBe('some input');
    });
  });

  describe('getInput - Property Metadata', () => {
    it('should pass property names correctly', () => {
      const properties = [platformProperty, projectNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'test',
      });

      service.getInput(properties);

      const lastCall = mockToolExecutor.getLastCall();
      const passedProperties = lastCall?.input.propertiesRequiringInput;

      expect(passedProperties[0].propertyName).toBe('platform');
      expect(passedProperties[1].propertyName).toBe('projectName');
    });

    it('should pass friendly names correctly', () => {
      const properties = [platformProperty, projectNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'test',
      });

      service.getInput(properties);

      const lastCall = mockToolExecutor.getLastCall();
      const passedProperties = lastCall?.input.propertiesRequiringInput;

      expect(passedProperties[0].friendlyName).toBe('mobile platform');
      expect(passedProperties[1].friendlyName).toBe('project name');
    });

    it('should pass descriptions correctly', () => {
      const properties = [packageNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'test',
      });

      service.getInput(properties);

      const lastCall = mockToolExecutor.getLastCall();
      const passedProperties = lastCall?.input.propertiesRequiringInput;

      expect(passedProperties[0].description).toContain('package identifier');
      expect(passedProperties[0].description).toContain('com.company.appname');
    });
  });

  describe('getInput - Error Handling', () => {
    it('should throw if tool result is not an object', () => {
      const properties = [platformProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, 'invalid');

      expect(() => {
        service.getInput(properties);
      }).toThrow(z.ZodError);
    });

    it('should allow any type for userUtterance', () => {
      const properties = [platformProperty];

      // All of these should be valid
      const testCases = ['string', 123, true, false, null, undefined, { key: 'value' }, ['array']];

      testCases.forEach(testCase => {
        mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
          userUtterance: testCase,
        });

        expect(() => {
          service.getInput(properties);
        }).not.toThrow();
      });
    });
  });

  describe('getInput - Logging', () => {
    it('should log input request start', () => {
      const properties = [platformProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      mockLogger.reset();
      service.getInput(properties);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const startLog = debugLogs.find(log => log.message.includes('Starting input request'));

      expect(startLog).toBeDefined();
      expect(startLog?.data).toMatchObject({
        unfulfilledProperties: properties,
      });
    });

    it('should log tool invocation', () => {
      const properties = [projectNameProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'MyApp',
      });

      mockLogger.reset();
      service.getInput(properties);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const invocationLog = debugLogs.find(log =>
        log.message.includes('Tool invocation data (pre-execution)')
      );

      expect(invocationLog).toBeDefined();
      expect(invocationLog?.data).toHaveProperty('toolInvocationData');
    });

    it('should log tool execution completion', () => {
      const properties = [platformProperty];

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });

      mockLogger.reset();
      service.getInput(properties);

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
      const properties = [platformProperty];
      const userInput = 'iOS';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle project name input', () => {
      const properties = [projectNameProperty];
      const userInput = 'MyAwesomeApp';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle package identifier input', () => {
      const properties = [packageNameProperty];
      const userInput = 'com.example.myapp';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle multiple properties at once', () => {
      const properties = [platformProperty, projectNameProperty, packageNameProperty];
      const userInput = 'iOS platform for MyApp with package com.example.myapp';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle Salesforce-specific properties', () => {
      const loginHostProperty: GetInputProperty = {
        propertyName: 'loginHost',
        friendlyName: 'Salesforce login host',
        description: 'The Salesforce login host for the mobile app.',
      };

      const properties = [loginHostProperty];
      const userInput = 'login.salesforce.com';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle boolean configuration questions', () => {
      const properties = [platformProperty];
      const userInput = true;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(true);
    });

    it('should handle numeric inputs', () => {
      const properties = [projectNameProperty];
      const userInput = 1.5;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(1.5);
    });

    it('should handle complex structured input', () => {
      const properties = [platformProperty, projectNameProperty];
      const userInput = {
        platform: 'iOS',
        projectName: 'MyApp',
      };

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toEqual(userInput);
    });

    it('should handle multiple sequential input requests', () => {
      // First input
      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'iOS',
      });
      const result1 = service.getInput([platformProperty]);

      // Second input
      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'MyApp',
      });
      const result2 = service.getInput([projectNameProperty]);

      // Third input
      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: 'com.example.myapp',
      });
      const result3 = service.getInput([packageNameProperty]);

      expect(result1).toBe('iOS');
      expect(result2).toBe('MyApp');
      expect(result3).toBe('com.example.myapp');
      expect(mockToolExecutor.getCallHistory()).toHaveLength(3);
    });
  });

  describe('getInput - Edge Cases', () => {
    it('should handle empty string input', () => {
      const properties = [projectNameProperty];
      const userInput = '';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const properties = [platformProperty];
      const userInput = '   ';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe('   ');
    });

    it('should handle very long input', () => {
      const properties = [projectNameProperty];
      const userInput = 'A'.repeat(10000);

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
      expect((result as string).length).toBe(10000);
    });

    it('should handle input with special characters', () => {
      const properties = [packageNameProperty];
      const userInput = 'Test\'s "quoted" value & special <chars>';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle input with unicode characters', () => {
      const properties = [projectNameProperty];
      const userInput = 'My App 🚀📱';

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBe(userInput);
    });

    it('should handle undefined input', () => {
      const properties = [platformProperty];
      const userInput = undefined;

      mockToolExecutor.setResult(GET_INPUT_TOOL.toolId, {
        userUtterance: userInput,
      });

      const result = service.getInput(properties);

      expect(result).toBeUndefined();
    });

    it('should handle deeply nested object input', () => {
      const properties = [platformProperty];
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

      const result = service.getInput(properties);

      expect(result).toEqual(userInput);
    });
  });
});
