/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InitialUserInputNode } from '../../../src/workflow/nodes/initialUserInput.js';
import { MockToolExecutor } from '../../utils/MockToolExecutor.js';
import { MockLogger } from '../../utils/MockLogger.js';
import { MockInputExtractionService } from '../../utils/MockInputExtractionService.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { WORKFLOW_USER_INPUT_PROPERTIES } from '../../../src/workflow/metadata.js';
import { INPUT_EXTRACTION_TOOL } from '../../../src/tools/plan/sfmobile-native-input-extraction/metadata.js';

describe('InitialUserInputNode', () => {
  let mockToolExecutor: MockToolExecutor;
  let mockLogger: MockLogger;
  let node: InitialUserInputNode;

  beforeEach(() => {
    mockToolExecutor = new MockToolExecutor();
    mockLogger = new MockLogger();
    node = new InitialUserInputNode(undefined, mockToolExecutor, mockLogger);
  });

  describe('Node Properties', () => {
    it('should have correct node name', () => {
      expect(node.name).toBe('triageUserInput');
    });
  });

  describe('Constructor', () => {
    it('should accept custom extraction service', () => {
      const mockService = new MockInputExtractionService();

      const customNode = new InitialUserInputNode(mockService);
      expect(customNode['extractionService']).toBe(mockService);
    });

    it('should create default extraction service when none provided', () => {
      const defaultNode = new InitialUserInputNode();
      expect(defaultNode['extractionService']).toBeDefined();
    });

    it('should pass tool executor to extraction service', () => {
      const customExecutor = new MockToolExecutor();
      const customNode = new InitialUserInputNode(undefined, customExecutor);

      expect(customNode['extractionService']['toolExecutor']).toBe(customExecutor);
    });

    it('should pass logger to extraction service', () => {
      const customLogger = new MockLogger();
      const customNode = new InitialUserInputNode(undefined, undefined, customLogger);

      expect(customNode['extractionService']['logger']).toBe(customLogger);
    });
  });

  describe('execute() - Successful Extraction', () => {
    it('should extract platform from user input', () => {
      const inputState = createTestState({
        userInput: 'Create an iOS app',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'iOS',
      });
    });

    it('should extract multiple properties from user input', () => {
      const inputState = createTestState({
        userInput: 'Create MyApp for Android, package com.test.myapp',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'Android',
          projectName: 'MyApp',
          packageName: 'com.test.myapp',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'Android',
        projectName: 'MyApp',
        packageName: 'com.test.myapp',
      });
    });

    it('should extract all workflow properties when present', () => {
      const inputState = createTestState({
        userInput:
          'Create TestApp for iOS with package com.test.app, org TestOrg, client abc123, callback testapp://oauth, host login.salesforce.com',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS',
          projectName: 'TestApp',
          packageName: 'com.test.app',
          organization: 'TestOrg',
          connectedAppClientId: 'abc123',
          connectedAppCallbackUri: 'testapp://oauth',
          loginHost: 'login.salesforce.com',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'iOS',
        projectName: 'TestApp',
        packageName: 'com.test.app',
        organization: 'TestOrg',
        connectedAppClientId: 'abc123',
        connectedAppCallbackUri: 'testapp://oauth',
        loginHost: 'login.salesforce.com',
      });
    });
  });

  describe('execute() - Partial Extraction', () => {
    it('should return only extracted properties when some are missing', () => {
      const inputState = createTestState({
        userInput: 'iOS app',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'iOS',
      });
      expect(result).not.toHaveProperty('projectName');
      expect(result).not.toHaveProperty('packageName');
    });

    it('should filter out null values', () => {
      const inputState = createTestState({
        userInput: 'Android app',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'Android',
          projectName: null,
          packageName: null,
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'Android',
      });
    });
  });

  describe('execute() - Validation', () => {
    it('should filter out invalid platform values', () => {
      const inputState = createTestState({
        userInput: 'Windows app',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'Windows', // Invalid - not in enum
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({});
      expect(result).not.toHaveProperty('platform');
    });

    it('should filter out properties with wrong types', () => {
      const inputState = createTestState({
        userInput: 'test',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          projectName: 123, // Should be string
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({});
    });

    it('should keep valid properties and filter invalid ones', () => {
      const inputState = createTestState({
        userInput: 'test',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS', // valid
          projectName: 'MyApp', // valid
          packageName: 123, // invalid type
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'iOS',
        projectName: 'MyApp',
      });
      expect(result).not.toHaveProperty('packageName');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty user input', () => {
      const inputState = createTestState({
        userInput: '',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {},
      });

      const result = node.execute(inputState);

      expect(result).toEqual({});
    });

    it('should handle user input with no extractable properties', () => {
      const inputState = createTestState({
        userInput: 'random text with nothing useful',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {},
      });

      const result = node.execute(inputState);

      expect(result).toEqual({});
    });

    it('should handle complex user input objects', () => {
      const inputState = createTestState({
        userInput: {
          message: 'Create iOS app',
          metadata: { source: 'test' },
        },
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'iOS',
      });
    });
  });

  describe('execute() - Integration with Service', () => {
    it('should pass user input to extraction service', () => {
      const userInput = 'test input';
      const inputState = createTestState({ userInput });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {},
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      expect(lastCall?.input.userUtterance).toBe(userInput);
    });

    it('should pass workflow properties to extraction service', () => {
      const inputState = createTestState({
        userInput: 'test',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {},
      });

      node.execute(inputState);

      const lastCall = mockToolExecutor.getLastCall();
      const propertiesToExtract = lastCall?.input.propertiesToExtract;

      // Verify all workflow properties are included
      expect(propertiesToExtract).toBeDefined();
      expect(propertiesToExtract?.length).toBe(Object.keys(WORKFLOW_USER_INPUT_PROPERTIES).length);

      // Verify structure of properties
      const propertyNames = propertiesToExtract?.map(
        (p: { propertyName: string }) => p.propertyName
      );
      expect(propertyNames).toContain('platform');
      expect(propertyNames).toContain('projectName');
      expect(propertyNames).toContain('packageName');
      expect(propertyNames).toContain('organization');
      expect(propertyNames).toContain('connectedAppClientId');
      expect(propertyNames).toContain('connectedAppCallbackUri');
      expect(propertyNames).toContain('loginHost');
    });

    it('should call extraction service exactly once', () => {
      const mockService = new MockInputExtractionService();
      mockService.setResult({ extractedProperties: {} });

      const customNode = new InitialUserInputNode(mockService);
      const inputState = createTestState({ userInput: 'test' });

      customNode.execute(inputState);

      expect(mockService.getCallHistory()).toHaveLength(1);
    });

    it('should pass correct arguments to extraction service', () => {
      const mockService = new MockInputExtractionService();
      mockService.setResult({ extractedProperties: {} });

      const customNode = new InitialUserInputNode(mockService);
      const userInput = 'test input';
      const inputState = createTestState({ userInput });

      customNode.execute(inputState);

      const lastCall = mockService.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.userInput).toBe(userInput);
      expect(lastCall?.properties).toBe(WORKFLOW_USER_INPUT_PROPERTIES);
    });
  });

  describe('execute() - Return Value', () => {
    it('should return extraction result as partial state', () => {
      const inputState = createTestState({
        userInput: 'iOS app MyApp',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS',
          projectName: 'MyApp',
        },
      });

      const result = node.execute(inputState);

      // Result should be a plain object (not wrapped)
      expect(result).toEqual({
        platform: 'iOS',
        projectName: 'MyApp',
      });

      // Should not have extractedProperties wrapper
      expect(result).not.toHaveProperty('extractedProperties');
    });

    it('should return empty object when no properties extracted', () => {
      const inputState = createTestState({
        userInput: 'nothing useful',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {},
      });

      const result = node.execute(inputState);

      expect(result).toEqual({});
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should extract from natural language description', () => {
      const inputState = createTestState({
        userInput:
          'I want to build a mobile application called FieldService for the Android platform',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'Android',
          projectName: 'FieldService',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'Android',
        projectName: 'FieldService',
      });
    });

    it('should extract from technical specification format', () => {
      const inputState = createTestState({
        userInput: `
          Platform: iOS
          Project: SalesApp
          Package: com.salesforce.sales
          Organization: Salesforce
        `,
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'iOS',
          projectName: 'SalesApp',
          packageName: 'com.salesforce.sales',
          organization: 'Salesforce',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'iOS',
        projectName: 'SalesApp',
        packageName: 'com.salesforce.sales',
        organization: 'Salesforce',
      });
    });

    it('should handle abbreviated or informal input', () => {
      const inputState = createTestState({
        userInput: 'android, MyApp, com.mycompany.app',
      });

      mockToolExecutor.setResult(INPUT_EXTRACTION_TOOL.toolId, {
        extractedProperties: {
          platform: 'Android',
          projectName: 'MyApp',
          packageName: 'com.mycompany.app',
        },
      });

      const result = node.execute(inputState);

      expect(result).toEqual({
        platform: 'Android',
        projectName: 'MyApp',
        packageName: 'com.mycompany.app',
      });
    });
  });
});
