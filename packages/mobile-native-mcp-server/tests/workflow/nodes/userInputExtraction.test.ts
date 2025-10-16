/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserInputExtractionNode } from '../../../src/workflow/nodes/userInputExtraction.js';
import { MockInputExtractionService } from '../../utils/MockInputExtractionService.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { WORKFLOW_USER_INPUT_PROPERTIES } from '../../../src/workflow/metadata.js';
import { PropertyMetadataCollection } from '../../../src/common/propertyMetadata.js';

describe('UserInputExtractionNode', () => {
  let mockExtractionService: MockInputExtractionService;

  // Test property subsets for focused testing
  const twoPropertySubset: PropertyMetadataCollection = {
    platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
    projectName: WORKFLOW_USER_INPUT_PROPERTIES.projectName,
  };

  const threePropertySubset: PropertyMetadataCollection = {
    platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
    projectName: WORKFLOW_USER_INPUT_PROPERTIES.projectName,
    packageName: WORKFLOW_USER_INPUT_PROPERTIES.packageName,
  };

  beforeEach(() => {
    mockExtractionService = new MockInputExtractionService();
  });

  describe('Node Properties', () => {
    it('should have correct node name', () => {
      const node = new UserInputExtractionNode();
      expect(node.name).toBe('userInputExtraction');
    });
  });

  describe('Constructor', () => {
    it('should accept custom required properties', () => {
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const node = new UserInputExtractionNode(customProperties);
      expect(node['requiredProperties']).toBe(customProperties);
    });

    it('should default to WORKFLOW_USER_INPUT_PROPERTIES when no properties provided', () => {
      const node = new UserInputExtractionNode();
      expect(node['requiredProperties']).toBe(WORKFLOW_USER_INPUT_PROPERTIES);
    });

    it('should accept custom extraction service', () => {
      const node = new UserInputExtractionNode(undefined, mockExtractionService);
      expect(node['extractionService']).toBe(mockExtractionService);
    });

    it('should create default extraction service when none provided', () => {
      const node = new UserInputExtractionNode();
      expect(node['extractionService']).toBeDefined();
    });

    it('should allow both custom properties and custom service', () => {
      const customProperties = twoPropertySubset;
      const node = new UserInputExtractionNode(customProperties, mockExtractionService);

      expect(node['requiredProperties']).toBe(customProperties);
      expect(node['extractionService']).toBe(mockExtractionService);
    });
  });

  describe('execute() - Property Extraction', () => {
    it('should extract all properties from initial input', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'Create MyApp for iOS',
      });

      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'iOS',
          projectName: 'MyApp',
        },
      });

      const result = node.execute(inputState);

      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('MyApp');
    });

    it('should extract partial properties from initial input', () => {
      const node = new UserInputExtractionNode(threePropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'Create MyApp for Android',
      });

      // Only platform and projectName extracted, packageName missing
      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'Android',
          projectName: 'MyApp',
        },
      });

      const result = node.execute(inputState);

      expect(result.platform).toBe('Android');
      expect(result.projectName).toBe('MyApp');
      expect(result.packageName).toBeUndefined();
    });

    it('should return empty result when no properties extracted', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'unclear input',
      });

      mockExtractionService.setResult({
        extractedProperties: {},
      });

      const result = node.execute(inputState);

      expect(result.platform).toBeUndefined();
      expect(result.projectName).toBeUndefined();
    });

    it('should handle complex natural language input', () => {
      const node = new UserInputExtractionNode(threePropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput:
          'I want to build a mobile application called FieldService for the Android platform with package com.salesforce.fieldservice',
      });

      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'Android',
          projectName: 'FieldService',
          packageName: 'com.salesforce.fieldservice',
        },
      });

      const result = node.execute(inputState);

      expect(result.platform).toBe('Android');
      expect(result.projectName).toBe('FieldService');
      expect(result.packageName).toBe('com.salesforce.fieldservice');
    });
  });

  describe('execute() - Service Integration', () => {
    it('should call extraction service with correct parameters', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const userInput = 'test input';
      const inputState = createTestState({ userInput });

      mockExtractionService.setResult({
        extractedProperties: { platform: 'iOS' },
      });

      node.execute(inputState);

      const calls = mockExtractionService.getCallHistory();
      expect(calls).toHaveLength(1);

      const firstCall = calls[0];
      expect(firstCall.userInput).toBe(userInput);
      expect(firstCall.properties).toBe(twoPropertySubset);
    });

    it('should call extraction service exactly once per execute', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'create app',
      });

      mockExtractionService.setResult({
        extractedProperties: { platform: 'iOS' },
      });

      node.execute(inputState);

      expect(mockExtractionService.getCallHistory()).toHaveLength(1);
    });

    it('should pass all required properties to extraction service', () => {
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
        projectName: WORKFLOW_USER_INPUT_PROPERTIES.projectName,
        packageName: WORKFLOW_USER_INPUT_PROPERTIES.packageName,
        organization: WORKFLOW_USER_INPUT_PROPERTIES.organization,
      };

      const node = new UserInputExtractionNode(customProperties, mockExtractionService);

      const inputState = createTestState({
        userInput: 'test',
      });

      mockExtractionService.setResult({
        extractedProperties: {},
      });

      node.execute(inputState);

      const lastCall = mockExtractionService.getLastCall();
      expect(lastCall?.properties).toBe(customProperties);
      expect(Object.keys(lastCall?.properties ?? {})).toHaveLength(4);
    });
  });

  describe('execute() - Return Value', () => {
    it('should return flat object with extracted properties', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'iOS app MyApp',
      });

      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'iOS',
          projectName: 'MyApp',
        },
      });

      const result = node.execute(inputState);

      // Should be plain object (not nested under extractedProperties)
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('projectName');
      expect(result).not.toHaveProperty('extractedProperties');
    });

    it('should return Partial<State> compatible object', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'test',
      });

      mockExtractionService.setResult({
        extractedProperties: { platform: 'Android' },
      });

      const result = node.execute(inputState);

      // Result should be compatible with Partial<State>
      // This is a compile-time check, but we can verify runtime structure
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });

    it('should not include undefined properties in return value', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'iOS',
      });

      mockExtractionService.setResult({
        extractedProperties: { platform: 'iOS' },
        // projectName not included
      });

      const result = node.execute(inputState);

      expect(result.platform).toBe('iOS');
      // Property not extracted should be undefined (not explicitly set)
      expect(result.projectName).toBeUndefined();
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty user input', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: '',
      });

      mockExtractionService.setResult({
        extractedProperties: {},
      });

      const result = node.execute(inputState);

      expect(result.platform).toBeUndefined();
      expect(result.projectName).toBeUndefined();
    });

    it('should handle null user input', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: null,
      });

      mockExtractionService.setResult({
        extractedProperties: {},
      });

      node.execute(inputState);

      expect(mockExtractionService.getCallHistory()).toHaveLength(1);
      expect(mockExtractionService.getLastCall()?.userInput).toBeNull();
    });

    it('should handle structured object as user input', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const structuredInput = {
        request: 'Create app',
        platform: 'iOS',
      };

      const inputState = createTestState({
        userInput: structuredInput,
      });

      mockExtractionService.setResult({
        extractedProperties: { platform: 'iOS' },
      });

      const result = node.execute(inputState);

      const lastCall = mockExtractionService.getLastCall();
      expect(lastCall?.userInput).toBe(structuredInput);
      expect(result.platform).toBe('iOS');
    });
  });

  describe('execute() - State Preservation', () => {
    it('should not modify input state', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'iOS app',
        platform: undefined,
      });

      const originalUserInput = inputState.userInput;

      mockExtractionService.setResult({
        extractedProperties: { platform: 'iOS' },
      });

      node.execute(inputState);

      // Input state should remain unchanged
      expect(inputState.userInput).toBe(originalUserInput);
      expect(inputState.platform).toBeUndefined();
    });

    it('should return new object without mutating extraction result', () => {
      const node = new UserInputExtractionNode(twoPropertySubset, mockExtractionService);

      const inputState = createTestState({
        userInput: 'test',
      });

      const extractedProperties = { platform: 'iOS', projectName: 'MyApp' };
      mockExtractionService.setResult({
        extractedProperties,
      });

      const result = node.execute(inputState);

      // Modifying result should not affect the original extraction result
      result.platform = 'Android';
      expect(extractedProperties.platform).toBe('iOS');
    });
  });
});
