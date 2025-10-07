/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import z from 'zod';
import { InputExtractionService } from '../../../src/workflow/services/inputExtractionService.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { PropertyMetadataCollection } from '../../../src/common/propertyMetadata.js';
import { INPUT_EXTRACTION_TOOL } from '../../../src/tools/plan/sfmobile-native-input-extraction/metadata.js';

describe('InputExtractionService', () => {
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;
  let service: InputExtractionService;

  // Test property metadata collection
  const testProperties: PropertyMetadataCollection = {
    platform: {
      zodType: z.enum(['iOS', 'Android']),
      description: 'Target mobile platform',
      friendlyName: 'platform',
    },
    projectName: {
      zodType: z.string(),
      description: 'Name of the project',
      friendlyName: 'project name',
    },
    version: {
      zodType: z.string(),
      description: 'Version number',
      friendlyName: 'version',
    },
  };

  beforeEach(() => {
    mockToolExecutor = new MockToolExecutor();
    mockLogger = new MockLogger();
    service = new InputExtractionService(mockToolExecutor, mockLogger);
  });

  describe('Constructor', () => {
    it('should use provided tool executor', () => {
      expect(service['toolExecutor']).toBe(mockToolExecutor);
    });

    it('should use provided logger', () => {
      expect(service['logger']).toBe(mockLogger);
    });

    it('should create default dependencies when none provided', () => {
      const serviceWithDefaults = new InputExtractionService();
      expect(serviceWithDefaults['toolExecutor']).toBeDefined();
      expect(serviceWithDefaults['logger']).toBeDefined();
    });
  });

  describe('extractProperties - Successful Extraction', () => {
    it('should extract and validate all properties successfully', () => {
      const userInput = 'Create an iOS app called MyApp version 1.0';

      const toolResult = {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'projectName', propertyValue: 'MyApp' },
          { propertyName: 'version', propertyValue: '1.0' },
        ],
      };

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, toolResult);

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({
        platform: 'iOS',
        projectName: 'MyApp',
        version: '1.0',
      });
    });

    it('should call tool executor with correct parameters', () => {
      const userInput = 'Create an Android app';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'platform', propertyValue: 'Android' }],
      });

      service.extractProperties(userInput, testProperties);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.llmMetadata.name).toBe(INPUT_EXTRACTION_TOOL.toolId);
      expect(lastCall?.llmMetadata.description).toBe(INPUT_EXTRACTION_TOOL.description);
      expect(lastCall?.input).toHaveProperty('userUtterance', userInput);
      expect(lastCall?.input).toHaveProperty('propertiesToExtract');
    });

    it('should prepare properties to extract with correct format', () => {
      const userInput = 'test input';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [],
      });

      service.extractProperties(userInput, testProperties);

      const lastCall = mockToolExecutor.getLastCall();
      const propertiesToExtract = lastCall?.input.propertiesToExtract;

      expect(propertiesToExtract).toHaveLength(3);
      expect(propertiesToExtract).toContainEqual({
        propertyName: 'platform',
        description: 'Target mobile platform',
      });
      expect(propertiesToExtract).toContainEqual({
        propertyName: 'projectName',
        description: 'Name of the project',
      });
      expect(propertiesToExtract).toContainEqual({
        propertyName: 'version',
        description: 'Version number',
      });
    });

    it('should extract partial properties when some are not found', () => {
      const userInput = 'iOS app';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'projectName', propertyValue: null },
          { propertyName: 'version', propertyValue: null },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({
        platform: 'iOS',
      });
      expect(result.extractedProperties).not.toHaveProperty('projectName');
      expect(result.extractedProperties).not.toHaveProperty('version');
    });
  });

  describe('extractProperties - Validation and Filtering', () => {
    it('should filter out null values', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'projectName', propertyValue: null },
          { propertyName: 'version', propertyValue: null },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({ platform: 'iOS' });
    });

    it('should filter out undefined values', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'projectName', propertyValue: undefined },
          { propertyName: 'version', propertyValue: undefined },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({ platform: 'iOS' });
    });

    it('should filter out properties that fail Zod validation', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'Windows' }, // Invalid - not in enum
          { propertyName: 'projectName', propertyValue: 'ValidName' },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({
        projectName: 'ValidName',
      });
      expect(result.extractedProperties).not.toHaveProperty('platform');
    });

    it('should filter out unknown properties not in metadata', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'unknownProperty', propertyValue: 'some value' },
          { propertyName: 'anotherUnknown', propertyValue: 123 },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({ platform: 'iOS' });
      expect(result.extractedProperties).not.toHaveProperty('unknownProperty');
      expect(result.extractedProperties).not.toHaveProperty('anotherUnknown');
    });

    it('should validate enum properties correctly', () => {
      const userInput = 'Android app';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'platform', propertyValue: 'Android' }],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties.platform).toBe('Android');
    });

    it('should validate string properties correctly', () => {
      const userInput = 'MyProject';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'projectName', propertyValue: 'MyProject' },
          { propertyName: 'version', propertyValue: '2.0.1' },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({
        projectName: 'MyProject',
        version: '2.0.1',
      });
    });

    it('should handle mix of valid and invalid properties', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' }, // valid
          { propertyName: 'projectName', propertyValue: 123 }, // invalid type (should be string)
          { propertyName: 'version', propertyValue: '1.0' }, // valid
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({
        platform: 'iOS',
        version: '1.0',
      });
      expect(result.extractedProperties).not.toHaveProperty('projectName');
    });
  });

  describe('extractProperties - Edge Cases', () => {
    it('should handle empty property collection', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [],
      });

      const result = service.extractProperties(userInput, {});

      expect(result.extractedProperties).toEqual({});
    });

    it('should handle no extracted properties', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({});
    });

    it('should handle all properties returning null', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: null },
          { propertyName: 'projectName', propertyValue: null },
          { propertyName: 'version', propertyValue: null },
        ],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({});
    });

    it('should handle complex user input types', () => {
      const userInput = {
        text: 'iOS app',
        metadata: { source: 'test' },
      };

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'platform', propertyValue: 'iOS' }],
      });

      const result = service.extractProperties(userInput, testProperties);

      expect(result.extractedProperties).toEqual({ platform: 'iOS' });
    });
  });

  describe('extractProperties - Error Handling', () => {
    it('should throw ZodError if tool result structure is invalid', () => {
      const userInput = 'test';

      // Invalid result - missing extractedProperties
      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        wrongField: 'value',
      });

      expect(() => {
        service.extractProperties(userInput, testProperties);
      }).toThrow(z.ZodError);
    });

    it('should throw if tool result is not an object', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, 'invalid');

      expect(() => {
        service.extractProperties(userInput, testProperties);
      }).toThrow(z.ZodError);
    });

    it('should throw non-ZodError errors during validation', () => {
      const userInput = 'test';

      // Create a Zod schema that throws a non-ZodError
      const problematicProperties: PropertyMetadataCollection = {
        test: {
          zodType: z.string().refine(
            () => {
              throw new Error('Custom error');
            },
            { message: 'Should not reach here' }
          ),
          description: 'Test',
          friendlyName: 'test',
        },
      };

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'test', propertyValue: 'value' }],
      });

      expect(() => {
        service.extractProperties(userInput, problematicProperties);
      }).toThrow('Custom error');
    });
  });

  describe('extractProperties - Logging', () => {
    it('should log extraction start', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [],
      });

      mockLogger.reset();
      service.extractProperties(userInput, testProperties);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const startLog = debugLogs.find(log => log.message.includes('Starting property extraction'));

      expect(startLog).toBeDefined();
      expect(startLog?.data).toMatchObject({
        userInput,
        propertyCount: 3,
      });
    });

    it('should log tool invocation', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [],
      });

      mockLogger.reset();
      service.extractProperties(userInput, testProperties);

      const debugLogs = mockLogger.getLogsByLevel('debug');
      const invocationLog = debugLogs.find(log => log.message.includes('Invoking extraction tool'));

      expect(invocationLog).toBeDefined();
      expect(invocationLog?.data).toHaveProperty('toolInvocationData');
    });

    it('should log completion with extracted property count', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'iOS' },
          { propertyName: 'projectName', propertyValue: 'MyApp' },
        ],
      });

      mockLogger.reset();
      service.extractProperties(userInput, testProperties);

      const infoLogs = mockLogger.getLogsByLevel('info');
      const completionLog = infoLogs.find(log =>
        log.message.includes('Property extraction completed')
      );

      expect(completionLog).toBeDefined();
      expect(completionLog?.data).toMatchObject({
        extractedCount: 2,
        properties: ['platform', 'projectName'],
      });
    });

    it('should log invalid properties', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'platform', propertyValue: 'InvalidPlatform' },
          { propertyName: 'projectName', propertyValue: 'Valid' },
        ],
      });

      mockLogger.reset();
      service.extractProperties(userInput, testProperties);

      const infoLogs = mockLogger.getLogsByLevel('info');
      const invalidLog = infoLogs.find(log =>
        log.message.includes('Some properties failed validation')
      );

      expect(invalidLog).toBeDefined();
      expect((invalidLog?.data as { invalidProperties?: string[] })?.invalidProperties).toContain(
        'platform'
      );
    });

    it('should log unknown properties as warnings', () => {
      const userInput = 'test';

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'unknownProp', propertyValue: 'value' }],
      });

      mockLogger.reset();
      service.extractProperties(userInput, testProperties);

      const warnLogs = mockLogger.getLogsByLevel('warn');
      const unknownLog = warnLogs.find(log => log.message.includes('Unknown property'));

      expect(unknownLog).toBeDefined();
      expect(unknownLog?.data).toMatchObject({
        propertyName: 'unknownProp',
      });
    });
  });

  describe('extractProperties - Complex Scenarios', () => {
    it('should handle numeric properties', () => {
      const numericProperties: PropertyMetadataCollection = {
        count: {
          zodType: z.number(),
          description: 'Count value',
          friendlyName: 'count',
        },
      };

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'count', propertyValue: 42 }],
      });

      const result = service.extractProperties('test', numericProperties);

      expect(result.extractedProperties).toEqual({ count: 42 });
    });

    it('should handle boolean properties', () => {
      const booleanProperties: PropertyMetadataCollection = {
        enabled: {
          zodType: z.boolean(),
          description: 'Enabled flag',
          friendlyName: 'enabled',
        },
      };

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [{ propertyName: 'enabled', propertyValue: true }],
      });

      const result = service.extractProperties('test', booleanProperties);

      expect(result.extractedProperties).toEqual({ enabled: true });
    });

    it('should handle optional properties with Zod optional schema', () => {
      const optionalProperties: PropertyMetadataCollection = {
        optional: {
          zodType: z.string().optional(),
          description: 'Optional value',
          friendlyName: 'optional',
        },
        required: {
          zodType: z.string(),
          description: 'Required value',
          friendlyName: 'required',
        },
      };

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: [
          { propertyName: 'optional', propertyValue: null },
          { propertyName: 'required', propertyValue: 'value' },
        ],
      });

      const result = service.extractProperties('test', optionalProperties);

      expect(result.extractedProperties).toEqual({ required: 'value' });
    });
  });
});
