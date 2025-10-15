/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetUserInputNode } from '../../../src/workflow/nodes/getUserInput.js';
import { MockGetInputService } from '../../utils/MockGetInputService.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { WORKFLOW_USER_INPUT_PROPERTIES } from '../../../src/workflow/metadata.js';
import { PropertyMetadataCollection } from '../../../src/common/propertyMetadata.js';

describe('GetUserInputNode', () => {
  let mockInputService: MockGetInputService;

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
    mockInputService = new MockGetInputService();
  });

  describe('Node Properties', () => {
    it('should have correct node name', () => {
      const node = new GetUserInputNode();
      expect(node.name).toBe('getUserInput');
    });
  });

  describe('Constructor', () => {
    it('should accept custom required properties', () => {
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const node = new GetUserInputNode(customProperties);
      expect(node['requiredProperties']).toBe(customProperties);
    });

    it('should default to WORKFLOW_USER_INPUT_PROPERTIES when no properties provided', () => {
      const node = new GetUserInputNode();
      expect(node['requiredProperties']).toBe(WORKFLOW_USER_INPUT_PROPERTIES);
    });

    it('should accept custom input service', () => {
      const node = new GetUserInputNode(undefined, mockInputService);
      expect(node['getInputService']).toBe(mockInputService);
    });

    it('should create default input service when none provided', () => {
      const node = new GetUserInputNode();
      expect(node['getInputService']).toBeDefined();
    });

    it('should allow both custom properties and custom service', () => {
      const customProperties = twoPropertySubset;
      const node = new GetUserInputNode(customProperties, mockInputService);

      expect(node['requiredProperties']).toBe(customProperties);
      expect(node['getInputService']).toBe(mockInputService);
    });
  });

  describe('execute() - User Input Collection', () => {
    it('should collect user input for all unfulfilled properties', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      // State with no properties filled
      const inputState = createTestState({
        userInput: 'test',
      });

      const userResponse = 'iOS and MyApp';
      mockInputService.setUserInput(userResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(userResponse);

      // Verify service was called with unfulfilled properties
      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].unfulfilledProperties).toHaveLength(2);
      expect(calls[0].unfulfilledProperties[0].propertyName).toBe('platform');
      expect(calls[0].unfulfilledProperties[1].propertyName).toBe('projectName');
    });

    it('should collect input only for remaining unfulfilled properties', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      // State with platform already filled
      const inputState = createTestState({
        userInput: 'test',
        platform: 'iOS',
      });

      const userResponse = 'MyApp';
      mockInputService.setUserInput(userResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(userResponse);

      // Should only ask for projectName
      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].unfulfilledProperties).toHaveLength(1);
      expect(calls[0].unfulfilledProperties[0].propertyName).toBe('projectName');
    });

    it('should handle text user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('iOS and MyAwesomeApp');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('iOS and MyAwesomeApp');
    });

    it('should handle structured user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      const structuredResponse = {
        platform: 'iOS',
        projectName: 'MyApp',
      };
      mockInputService.setUserInput(structuredResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toEqual(structuredResponse);
    });

    it('should handle numeric user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput(8080);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(8080);
    });

    it('should handle boolean user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput(true);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(true);
    });

    it('should handle null user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput(null);

      const result = node.execute(inputState);

      expect(result.userInput).toBeNull();
    });
  });

  describe('execute() - Property Metadata Passing', () => {
    it('should pass correct metadata to input service', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('test');

      node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(1);

      const properties = calls[0].unfulfilledProperties;
      expect(properties).toHaveLength(2);

      // First property
      expect(properties[0].propertyName).toBe('platform');
      expect(properties[0].friendlyName).toBe('mobile platform');
      expect(properties[0].description).toContain('mobile platform');

      // Second property
      expect(properties[1].propertyName).toBe('projectName');
      expect(properties[1].friendlyName).toBe('project name');
      expect(properties[1].description).toBeDefined();
    });

    it('should include only unfulfilled properties in metadata', () => {
      const node = new GetUserInputNode(threePropertySubset, mockInputService);

      // Only packageName is missing
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
      });

      mockInputService.setUserInput('com.test.app');

      node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      const properties = calls[0].unfulfilledProperties;

      expect(properties).toHaveLength(1);
      expect(properties[0].propertyName).toBe('packageName');
      expect(properties[0].friendlyName).toBe('package identifier');
    });

    it('should maintain property order from collection', () => {
      const node = new GetUserInputNode(threePropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('test');

      node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      const properties = calls[0].unfulfilledProperties;

      expect(properties).toHaveLength(3);
      expect(properties[0].propertyName).toBe('platform');
      expect(properties[1].propertyName).toBe('projectName');
      expect(properties[2].propertyName).toBe('packageName');
    });
  });

  describe('execute() - Service Integration', () => {
    it('should call input service exactly once', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('test response');

      node.execute(inputState);

      expect(mockInputService.getCallHistory()).toHaveLength(1);
    });

    it('should pass all unfulfilled properties to service in single call', () => {
      const node = new GetUserInputNode(threePropertySubset, mockInputService);

      const inputState = createTestState({
        platform: 'iOS',
        // projectName and packageName missing
      });

      mockInputService.setUserInput('MyApp and com.test.app');

      node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].unfulfilledProperties).toHaveLength(2);
    });
  });

  describe('execute() - Return Value', () => {
    it('should return object with userInput property', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('test');

      const result = node.execute(inputState);

      expect(result).toHaveProperty('userInput');
      expect(result.userInput).toBe('test');
    });

    it('should return Partial<State> compatible object', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('test');

      const result = node.execute(inputState);

      // Result should be compatible with Partial<State>
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      expect('userInput' in result).toBe(true);
    });

    it('should only include userInput in return value', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('test');

      const result = node.execute(inputState);

      // Should only have userInput property
      const keys = Object.keys(result);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('userInput');
    });

    it('should preserve the type of user input in return value', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      // Test with object
      const objectInput = { key: 'value' };
      mockInputService.setUserInput(objectInput);
      const result1 = node.execute(inputState);
      expect(result1.userInput).toBe(objectInput);
      expect(typeof result1.userInput).toBe('object');

      // Test with string
      mockInputService.setUserInput('string value');
      const result2 = node.execute(inputState);
      expect(result2.userInput).toBe('string value');
      expect(typeof result2.userInput).toBe('string');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle state with some properties undefined', () => {
      const node = new GetUserInputNode(threePropertySubset, mockInputService);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: undefined,
        packageName: undefined,
      });

      mockInputService.setUserInput('MyApp and com.test.app');

      const result = node.execute(inputState);

      expect(result.userInput).toBeDefined();

      const calls = mockInputService.getCallHistory();
      // Should include projectName and packageName
      expect(calls[0].unfulfilledProperties).toHaveLength(2);
    });

    it('should handle custom property collection', () => {
      const customProperties: PropertyMetadataCollection = {
        organization: WORKFLOW_USER_INPUT_PROPERTIES.organization,
        loginHost: WORKFLOW_USER_INPUT_PROPERTIES.loginHost,
      };

      const node = new GetUserInputNode(customProperties, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('MyOrg and login.salesforce.com');

      const result = node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      expect(calls[0].unfulfilledProperties).toHaveLength(2);
      expect(calls[0].unfulfilledProperties[0].propertyName).toBe('organization');
      expect(calls[0].unfulfilledProperties[1].propertyName).toBe('loginHost');
      expect(result.userInput).toBeDefined();
    });

    it('should handle single property collection', () => {
      const singleProperty: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const node = new GetUserInputNode(singleProperty, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('iOS');

      const result = node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].unfulfilledProperties).toHaveLength(1);
      expect(calls[0].unfulfilledProperties[0].propertyName).toBe('platform');
      expect(result.userInput).toBe('iOS');
    });

    it('should handle empty string user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('');
    });

    it('should handle undefined user responses', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput(undefined);

      const result = node.execute(inputState);

      expect(result.userInput).toBeUndefined();
    });
  });

  describe('execute() - State Preservation', () => {
    it('should not modify input state', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const originalPlatform = 'iOS';

      const inputState = createTestState({
        platform: originalPlatform,
      });

      mockInputService.setUserInput('MyApp');

      node.execute(inputState);

      // Input state should remain unchanged
      expect(inputState.platform).toBe(originalPlatform);
      // userInput should not be set on input state
      expect(inputState.userInput).not.toBe('MyApp');
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle initial prompt for all properties', () => {
      const node = new GetUserInputNode(twoPropertySubset, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('iOS for mobile app MyFieldService');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('iOS for mobile app MyFieldService');

      const calls = mockInputService.getCallHistory();
      expect(calls[0].unfulfilledProperties).toHaveLength(2);
    });

    it('should handle follow-up prompt for remaining properties', () => {
      const node = new GetUserInputNode(threePropertySubset, mockInputService);

      const inputState = createTestState({
        platform: 'Android',
        projectName: 'FieldService',
      });

      mockInputService.setUserInput('com.salesforce.fieldservice');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('com.salesforce.fieldservice');

      const calls = mockInputService.getCallHistory();
      expect(calls[0].unfulfilledProperties).toHaveLength(1);
      expect(calls[0].unfulfilledProperties[0].propertyName).toBe('packageName');
    });

    it('should handle multi-property response', () => {
      const node = new GetUserInputNode(threePropertySubset, mockInputService);

      const inputState = createTestState({});

      // User provides information for multiple properties at once
      const detailedResponse =
        'I want an iOS app named MyApp with package identifier com.test.myapp';
      mockInputService.setUserInput(detailedResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(detailedResponse);
    });

    it('should handle Salesforce-specific properties', () => {
      const salesforceProperties: PropertyMetadataCollection = {
        organization: WORKFLOW_USER_INPUT_PROPERTIES.organization,
        loginHost: WORKFLOW_USER_INPUT_PROPERTIES.loginHost,
      };

      const node = new GetUserInputNode(salesforceProperties, mockInputService);

      const inputState = createTestState({});

      mockInputService.setUserInput('Acme Corp and login.salesforce.com');

      node.execute(inputState);

      const calls = mockInputService.getCallHistory();
      expect(calls[0].unfulfilledProperties[0].friendlyName).toBe('organization or company name');
      expect(calls[0].unfulfilledProperties[1].friendlyName).toBe('Salesforce login host');
    });
  });
});
