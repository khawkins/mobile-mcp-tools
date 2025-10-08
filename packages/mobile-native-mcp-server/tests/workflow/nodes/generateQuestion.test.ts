/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateQuestionNode } from '../../../src/workflow/nodes/generateQuestion.js';
import { MockGenerateQuestionService } from '../../utils/MockGenerateQuestionService.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { WORKFLOW_USER_INPUT_PROPERTIES } from '../../../src/workflow/metadata.js';
import { PropertyMetadataCollection } from '../../../src/common/propertyMetadata.js';

describe('GenerateQuestionNode', () => {
  let mockQuestionService: MockGenerateQuestionService;

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
    mockQuestionService = new MockGenerateQuestionService();
  });

  describe('Node Properties', () => {
    it('should have correct node name', () => {
      const node = new GenerateQuestionNode();
      expect(node.name).toBe('generateQuestion');
    });
  });

  describe('Constructor', () => {
    it('should accept custom required properties', () => {
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const node = new GenerateQuestionNode(customProperties);
      expect(node['requiredProperties']).toBe(customProperties);
    });

    it('should default to WORKFLOW_USER_INPUT_PROPERTIES when no properties provided', () => {
      const node = new GenerateQuestionNode();
      expect(node['requiredProperties']).toBe(WORKFLOW_USER_INPUT_PROPERTIES);
    });

    it('should accept custom question generation service', () => {
      const node = new GenerateQuestionNode(undefined, mockQuestionService);
      expect(node['generateQuestionService']).toBe(mockQuestionService);
    });

    it('should create default question service when none provided', () => {
      const node = new GenerateQuestionNode();
      expect(node['generateQuestionService']).toBeDefined();
    });

    it('should allow both custom properties and custom service', () => {
      const customProperties = twoPropertySubset;
      const node = new GenerateQuestionNode(customProperties, mockQuestionService);

      expect(node['requiredProperties']).toBe(customProperties);
      expect(node['generateQuestionService']).toBe(mockQuestionService);
    });
  });

  describe('execute() - Question Generation', () => {
    it('should generate question for first missing property', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      // State with no properties filled
      const inputState = createTestState({
        userInput: 'test',
      });

      const expectedQuestion = 'What platform would you like to target?';
      mockQuestionService.setQuestion(expectedQuestion);

      const result = node.execute(inputState);

      expect(result.userInputQuestion).toBe(expectedQuestion);

      // Should have called question service for 'platform' (first property)
      const calls = mockQuestionService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('platform');
    });

    it('should generate question for second property when first is filled', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      // State with platform already filled
      const inputState = createTestState({
        userInput: 'test',
        platform: 'iOS',
      });

      const expectedQuestion = 'What is the name of your project?';
      mockQuestionService.setQuestion(expectedQuestion);

      const result = node.execute(inputState);

      expect(result.userInputQuestion).toBe(expectedQuestion);

      // Should have called question service for 'projectName' (second property)
      const calls = mockQuestionService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('projectName');
    });

    it('should skip over fulfilled properties to find next missing one', () => {
      const node = new GenerateQuestionNode(threePropertySubset, mockQuestionService);

      // State with platform and packageName filled, but projectName missing
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'MyApp',
        // packageName is missing
      });

      mockQuestionService.setQuestion('What is your package name?');

      const result = node.execute(inputState);

      expect(result.userInputQuestion).toBeDefined();

      // Should have called question service for 'packageName'
      const calls = mockQuestionService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('packageName');
    });

    it('should prioritize properties in order they are defined', () => {
      // Create properties in specific order
      const orderedProperties: PropertyMetadataCollection = {
        projectName: WORKFLOW_USER_INPUT_PROPERTIES.projectName,
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
        packageName: WORKFLOW_USER_INPUT_PROPERTIES.packageName,
      };

      const node = new GenerateQuestionNode(orderedProperties, mockQuestionService);

      // All properties missing
      const inputState = createTestState({});

      mockQuestionService.setQuestion('Test question');

      node.execute(inputState);

      // Should ask for first property in the collection (projectName)
      const calls = mockQuestionService.getCallHistory();
      expect(calls[0].name).toBe('projectName');
    });
  });

  describe('execute() - Metadata Passing', () => {
    it('should pass correct metadata to question generation service', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      const inputState = createTestState({});

      mockQuestionService.setQuestion('Test question');

      node.execute(inputState);

      const calls = mockQuestionService.getCallHistory();
      expect(calls).toHaveLength(1);

      const call = calls[0];
      expect(call.name).toBe('platform');
      expect(call.metadata).toBe(WORKFLOW_USER_INPUT_PROPERTIES.platform);
      expect(call.metadata.friendlyName).toBe('mobile platform');
      expect(call.metadata.description).toContain('mobile platform');
    });

    it('should pass metadata for second property correctly', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      // Platform already filled
      const inputState = createTestState({
        platform: 'iOS',
      });

      mockQuestionService.setQuestion('Test question');

      node.execute(inputState);

      const calls = mockQuestionService.getCallHistory();
      const call = calls[0];
      expect(call.name).toBe('projectName');
      expect(call.metadata).toBe(WORKFLOW_USER_INPUT_PROPERTIES.projectName);
      expect(call.metadata.friendlyName).toBe('project name');
    });
  });

  describe('execute() - Service Integration', () => {
    it('should call question generation service exactly once', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      const inputState = createTestState({});

      mockQuestionService.setQuestion('Test question');

      node.execute(inputState);

      expect(mockQuestionService.getCallHistory()).toHaveLength(1);
    });

    it('should not call question service if all properties are fulfilled', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      // All properties filled
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
      });

      // This would be an error case in practice (router should prevent this),
      // but we test the behavior anyway
      mockQuestionService.setQuestion('Test question');

      // Expect this to throw or handle gracefully
      // In current implementation, this will try to access undefined property
      expect(() => node.execute(inputState)).toThrow();
    });
  });

  describe('execute() - Return Value', () => {
    it('should return object with userInputQuestion property', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      const inputState = createTestState({});

      const question = 'What platform do you want?';
      mockQuestionService.setQuestion(question);

      const result = node.execute(inputState);

      expect(result).toHaveProperty('userInputQuestion');
      expect(result.userInputQuestion).toBe(question);
    });

    it('should return Partial<State> compatible object', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      const inputState = createTestState({});

      mockQuestionService.setQuestion('Test');

      const result = node.execute(inputState);

      // Result should be compatible with Partial<State>
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      expect('userInputQuestion' in result).toBe(true);
    });

    it('should only include userInputQuestion in return value', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      const inputState = createTestState({});

      mockQuestionService.setQuestion('Test');

      const result = node.execute(inputState);

      // Should only have userInputQuestion property
      const keys = Object.keys(result);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('userInputQuestion');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle state with some properties undefined', () => {
      const node = new GenerateQuestionNode(threePropertySubset, mockQuestionService);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: undefined, // Explicitly undefined
        packageName: undefined,
      });

      mockQuestionService.setQuestion('What is the project name?');

      const result = node.execute(inputState);

      expect(result.userInputQuestion).toBeDefined();

      const calls = mockQuestionService.getCallHistory();
      expect(calls[0].name).toBe('projectName');
    });

    it('should handle custom property collection', () => {
      const customProperties: PropertyMetadataCollection = {
        organization: WORKFLOW_USER_INPUT_PROPERTIES.organization,
        loginHost: WORKFLOW_USER_INPUT_PROPERTIES.loginHost,
      };

      const node = new GenerateQuestionNode(customProperties, mockQuestionService);

      const inputState = createTestState({});

      mockQuestionService.setQuestion('What is your organization?');

      const result = node.execute(inputState);

      const calls = mockQuestionService.getCallHistory();
      expect(calls[0].name).toBe('organization');
      expect(result.userInputQuestion).toBeDefined();
    });

    it('should handle single property collection', () => {
      const singleProperty: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const node = new GenerateQuestionNode(singleProperty, mockQuestionService);

      const inputState = createTestState({});

      mockQuestionService.setQuestion('Choose platform');

      const result = node.execute(inputState);

      const calls = mockQuestionService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('platform');
      expect(result.userInputQuestion).toBe('Choose platform');
    });
  });

  describe('execute() - State Preservation', () => {
    it('should not modify input state', () => {
      const node = new GenerateQuestionNode(twoPropertySubset, mockQuestionService);

      const inputState = createTestState({
        platform: 'iOS',
      });

      const originalPlatform = inputState.platform;

      mockQuestionService.setQuestion('Test');

      node.execute(inputState);

      // Input state should remain unchanged
      expect(inputState.platform).toBe(originalPlatform);
      expect(inputState.userInputQuestion).toBeUndefined();
    });
  });
});
