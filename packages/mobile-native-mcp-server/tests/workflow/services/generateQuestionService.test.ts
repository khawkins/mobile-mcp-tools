/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import z from 'zod';
import { GenerateQuestionService } from '../../../src/workflow/services/generateQuestionService.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { PropertyMetadata } from '../../../src/common/propertyMetadata.js';
import { GENERATE_QUESTION_TOOL } from '../../../src/tools/plan/sfmobile-native-generate-question/metadata.js';

describe('GenerateQuestionService', () => {
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;
  let service: GenerateQuestionService;

  // Test property metadata
  const platformMetadata: PropertyMetadata<z.ZodEnum<['iOS', 'Android']>> = {
    zodType: z.enum(['iOS', 'Android']),
    description: 'Target mobile platform for the mobile app (iOS or Android)',
    friendlyName: 'mobile platform',
  };

  const projectNameMetadata: PropertyMetadata<z.ZodString> = {
    zodType: z.string(),
    description: 'Name of the mobile application project',
    friendlyName: 'project name',
  };

  const packageNameMetadata: PropertyMetadata<z.ZodString> = {
    zodType: z.string(),
    description: 'The package identifier of the mobile app, for example com.company.appname',
    friendlyName: 'package identifier',
  };

  beforeEach(() => {
    mockToolExecutor = new MockToolExecutor();
    mockLogger = new MockLogger();
    service = new GenerateQuestionService(mockToolExecutor, mockLogger);
  });

  describe('Constructor', () => {
    it('should use provided tool executor', () => {
      expect(service['toolExecutor']).toBe(mockToolExecutor);
    });

    it('should use provided logger', () => {
      expect(service['logger']).toBe(mockLogger);
    });

    it('should create default dependencies when none provided', () => {
      const serviceWithDefaults = new GenerateQuestionService();
      expect(serviceWithDefaults['toolExecutor']).toBeDefined();
      expect(serviceWithDefaults['logger']).toBeDefined();
    });
  });

  describe('generateQuestionForProperty - Successful Generation', () => {
    it('should generate question for a property', () => {
      const expectedQuestion = 'What is your mobile platform?';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: expectedQuestion,
      });

      const result = service.generateQuestionForProperty('platform', platformMetadata);

      expect(result).toBe(expectedQuestion);
    });

    it('should call tool executor with correct parameters', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'Test question?',
      });

      service.generateQuestionForProperty('platform', platformMetadata);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.llmMetadata.name).toBe(GENERATE_QUESTION_TOOL.toolId);
      expect(lastCall?.llmMetadata.description).toBe(GENERATE_QUESTION_TOOL.description);
      expect(lastCall?.input).toHaveProperty('propertyMetadata');
    });

    it('should pass property metadata correctly', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'Test question?',
      });

      service.generateQuestionForProperty('projectName', projectNameMetadata);

      const lastCall = mockToolExecutor.getLastCall();
      const propertyMetadata = lastCall?.input.propertyMetadata;

      expect(propertyMetadata).toEqual({
        propertyName: 'projectName',
        friendlyName: 'project name',
        description: 'Name of the mobile application project',
      });
    });

    it('should handle complex property descriptions', () => {
      const expectedQuestion = 'What is the package identifier for your app?';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: expectedQuestion,
      });

      const result = service.generateQuestionForProperty('packageName', packageNameMetadata);

      expect(result).toBe(expectedQuestion);
    });

    it('should handle questions with format hints', () => {
      const dateMetadata: PropertyMetadata<z.ZodString> = {
        zodType: z.string(),
        description: 'The release date in YYYY-MM-DD format',
        friendlyName: 'release date',
      };

      const expectedQuestion = 'What is the release date? (Please use YYYY-MM-DD format)';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: expectedQuestion,
      });

      const result = service.generateQuestionForProperty('releaseDate', dateMetadata);

      expect(result).toBe(expectedQuestion);
    });
  });

  describe('generateQuestionForProperty - Various Property Types', () => {
    it('should generate question for enum property', () => {
      const question = 'Which mobile platform would you like to use?';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('platform', platformMetadata);

      expect(result).toBe(question);
    });

    it('should generate question for string property', () => {
      const question = 'What is your project name?';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('projectName', projectNameMetadata);

      expect(result).toBe(question);
    });

    it('should generate question for numeric property', () => {
      const versionMetadata: PropertyMetadata<z.ZodNumber> = {
        zodType: z.number(),
        description: 'The version number of the application',
        friendlyName: 'version number',
      };

      const question = 'What is the version number?';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('version', versionMetadata);

      expect(result).toBe(question);
    });

    it('should generate question for boolean property', () => {
      const enabledMetadata: PropertyMetadata<z.ZodBoolean> = {
        zodType: z.boolean(),
        description: 'Whether to enable offline capabilities',
        friendlyName: 'offline mode',
      };

      const question = 'Would you like to enable offline mode?';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('offlineEnabled', enabledMetadata);

      expect(result).toBe(question);
    });

    it('should generate question for optional property', () => {
      const optionalMetadata: PropertyMetadata<z.ZodOptional<z.ZodString>> = {
        zodType: z.string().optional(),
        description: 'Optional description text',
        friendlyName: 'description',
      };

      const question = 'Would you like to provide a description? (This is optional)';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('description', optionalMetadata);

      expect(result).toBe(question);
    });
  });

  describe('generateQuestionForProperty - Error Handling', () => {
    it('should throw ZodError if tool result structure is invalid', () => {
      // Invalid result - missing question
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        wrongField: 'value',
      });

      expect(() => {
        service.generateQuestionForProperty('platform', platformMetadata);
      }).toThrow(z.ZodError);
    });

    it('should throw if tool result is not an object', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, 'invalid');

      expect(() => {
        service.generateQuestionForProperty('platform', platformMetadata);
      }).toThrow(z.ZodError);
    });

    it('should throw if question is not a string', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 123,
      });

      expect(() => {
        service.generateQuestionForProperty('platform', platformMetadata);
      }).toThrow(z.ZodError);
    });

    it('should throw if question is null', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: null,
      });

      expect(() => {
        service.generateQuestionForProperty('platform', platformMetadata);
      }).toThrow(z.ZodError);
    });
  });

  describe('generateQuestionForProperty - Logging', () => {
    it('should log generation start', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'Test question?',
      });

      mockLogger.reset();
      service.generateQuestionForProperty('platform', platformMetadata);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const startLog = debugLogs.find(log => log.message.includes('Starting question generation'));

      expect(startLog).toBeDefined();
      expect(startLog?.data).toMatchObject({
        name: 'platform',
        metadata: platformMetadata,
      });
    });

    it('should log tool invocation', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'Test question?',
      });

      mockLogger.reset();
      service.generateQuestionForProperty('platform', platformMetadata);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const invocationLog = debugLogs.find(log =>
        log.message.includes('Tool invocation data (pre-execution)')
      );

      expect(invocationLog).toBeDefined();
      expect(invocationLog?.data).toHaveProperty('toolInvocationData');
    });

    it('should log tool execution completion', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'Test question?',
      });

      mockLogger.reset();
      service.generateQuestionForProperty('platform', platformMetadata);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const executionLog = debugLogs.find(log =>
        log.message.includes('Tool execution result (post-execution)')
      );

      expect(executionLog).toBeDefined();
      expect(executionLog?.data).toHaveProperty('result');
    });
  });

  describe('generateQuestionForProperty - Real World Scenarios', () => {
    it('should generate question for login host', () => {
      const loginHostMetadata: PropertyMetadata<z.ZodString> = {
        zodType: z.string(),
        description:
          'The Salesforce login host (e.g., login.salesforce.com or test.salesforce.com)',
        friendlyName: 'login host',
      };

      const question =
        'What is your login host? (For example: login.salesforce.com or test.salesforce.com)';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('loginHost', loginHostMetadata);

      expect(result).toBe(question);
    });

    it('should handle multiple question generations in sequence', () => {
      // First question
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'What is your mobile platform?',
      });
      const result1 = service.generateQuestionForProperty('platform', platformMetadata);

      // Second question
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'What is your project name?',
      });
      const result2 = service.generateQuestionForProperty('projectName', projectNameMetadata);

      // Third question
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'What is your package identifier?',
      });
      const result3 = service.generateQuestionForProperty('packageName', packageNameMetadata);

      expect(result1).toBe('What is your mobile platform?');
      expect(result2).toBe('What is your project name?');
      expect(result3).toBe('What is your package identifier?');
      expect(mockToolExecutor.getCallHistory()).toHaveLength(3);
    });
  });

  describe('generateQuestionForProperty - Edge Cases', () => {
    it('should handle empty string question', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: '',
      });

      const result = service.generateQuestionForProperty('platform', platformMetadata);

      expect(result).toBe('');
    });

    it('should handle very long questions', () => {
      const longQuestion =
        'What is your mobile platform? Please choose between iOS and Android. ' +
        'This decision will affect the development environment, programming language, ' +
        'and deployment process for your application.';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: longQuestion,
      });

      const result = service.generateQuestionForProperty('platform', platformMetadata);

      expect(result).toBe(longQuestion);
    });

    it('should handle questions with special characters', () => {
      const question = "What's your app's package identifier? (e.g., com.company.app-name_v2)";

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('packageName', packageNameMetadata);

      expect(result).toBe(question);
    });

    it('should handle questions with unicode characters', () => {
      const question = 'What is your project name? 🚀📱';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('projectName', projectNameMetadata);

      expect(result).toBe(question);
    });

    it('should handle questions with newlines', () => {
      const question = 'What is your mobile platform?\n(Choose iOS or Android)';

      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question,
      });

      const result = service.generateQuestionForProperty('platform', platformMetadata);

      expect(result).toBe(question);
    });
  });

  describe('generateQuestionForProperty - Integration with PropertyMetadata', () => {
    it('should use friendlyName from metadata', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'What is your mobile platform?',
      });

      service.generateQuestionForProperty('platform', platformMetadata);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.propertyMetadata.friendlyName).toBe('mobile platform');
    });

    it('should use description from metadata', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'What is your project name?',
      });

      service.generateQuestionForProperty('projectName', projectNameMetadata);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.propertyMetadata.description).toBe(
        'Name of the mobile application project'
      );
    });

    it('should use propertyName as passed to method', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'What is your package identifier?',
      });

      service.generateQuestionForProperty('packageName', packageNameMetadata);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.propertyMetadata.propertyName).toBe('packageName');
    });

    it('should not include zodType in tool invocation', () => {
      mockToolExecutor.setResult(GENERATE_QUESTION_TOOL.toolId, {
        question: 'Test question?',
      });

      service.generateQuestionForProperty('platform', platformMetadata);

      const lastCall = mockToolExecutor.getLastCall();
      const propertyMetadata = lastCall?.input.propertyMetadata;

      expect(propertyMetadata).not.toHaveProperty('zodType');
    });
  });
});
