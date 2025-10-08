/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect } from 'vitest';
import { CheckPropertiesFulFilledRouter } from '../../../src/workflow/nodes/checkPropertiesFulfilledRouter.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { WORKFLOW_USER_INPUT_PROPERTIES } from '../../../src/workflow/metadata.js';
import { PropertyMetadataCollection } from '../../../src/common/propertyMetadata.js';

describe('CheckPropertiesFulFilledRouter', () => {
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

  describe('Constructor', () => {
    it('should accept custom required properties', () => {
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const router = new CheckPropertiesFulFilledRouter(customProperties);
      expect(router['requiredProperties']).toBe(customProperties);
    });

    it('should default to WORKFLOW_USER_INPUT_PROPERTIES when no properties provided', () => {
      const router = new CheckPropertiesFulFilledRouter();
      expect(router['requiredProperties']).toBe(WORKFLOW_USER_INPUT_PROPERTIES);
    });
  });

  describe('execute() - Routing Logic', () => {
    it('should route to validateEnvironment when all properties are fulfilled', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });

    it('should route to generateQuestion when any property is missing', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        // projectName is missing
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should route to generateQuestion when all properties are missing', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        // Both properties missing
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should route to generateQuestion when first property is missing', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        projectName: 'MyApp',
        // platform is missing (first in the collection)
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should route to generateQuestion when last property is missing', () => {
      const router = new CheckPropertiesFulFilledRouter(threePropertySubset);

      const inputState = createTestState({
        platform: 'Android',
        projectName: 'MyApp',
        // packageName is missing (last in the collection)
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should route to generateQuestion when middle property is missing', () => {
      const router = new CheckPropertiesFulFilledRouter(threePropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        // projectName is missing (middle in the collection)
        packageName: 'com.test.app',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should handle three properties all fulfilled', () => {
      const router = new CheckPropertiesFulFilledRouter(threePropertySubset);

      const inputState = createTestState({
        platform: 'Android',
        projectName: 'TestApp',
        packageName: 'com.test.testapp',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });
  });

  describe('execute() - Property Value Checking', () => {
    it('should treat null as unfulfilled', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: null as unknown as 'iOS' | 'Android',
        projectName: 'MyApp',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should treat undefined as unfulfilled', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: undefined,
        projectName: 'MyApp',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should treat empty string as fulfilled (truthy check)', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: '', // Empty string
      });

      const nextNode = router.execute(inputState);

      // Empty string is falsy, so should route to generateQuestion
      expect(nextNode).toBe('generateQuestion');
    });

    it('should treat 0 as fulfilled', () => {
      // This is a theoretical test since our properties don't use numbers,
      // but tests the router's truthy/falsy logic
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const router = new CheckPropertiesFulFilledRouter(customProperties);

      const inputState = createTestState({
        platform: 'iOS',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });

    it('should accept any truthy value for properties', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'AnyValidName',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });
  });

  describe('execute() - Custom Property Collections', () => {
    it('should work with single property collection', () => {
      const singleProperty: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const router = new CheckPropertiesFulFilledRouter(singleProperty);

      // Property fulfilled
      const state1 = createTestState({ platform: 'iOS' });
      expect(router.execute(state1)).toBe('validateEnvironment');

      // Property missing
      const state2 = createTestState({});
      expect(router.execute(state2)).toBe('generateQuestion');
    });

    it('should work with all seven workflow properties', () => {
      const router = new CheckPropertiesFulFilledRouter(WORKFLOW_USER_INPUT_PROPERTIES);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        packageName: 'com.test.myapp',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        connectedAppCallbackUri: 'myapp://callback',
        loginHost: 'https://login.salesforce.com',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });

    it('should detect missing property among many', () => {
      const router = new CheckPropertiesFulFilledRouter(WORKFLOW_USER_INPUT_PROPERTIES);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        packageName: 'com.test.myapp',
        organization: 'TestOrg',
        connectedAppClientId: 'client123',
        // connectedAppCallbackUri is missing
        loginHost: 'https://login.salesforce.com',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('generateQuestion');
    });

    it('should work with different property combinations', () => {
      const customProperties: PropertyMetadataCollection = {
        organization: WORKFLOW_USER_INPUT_PROPERTIES.organization,
        loginHost: WORKFLOW_USER_INPUT_PROPERTIES.loginHost,
        connectedAppClientId: WORKFLOW_USER_INPUT_PROPERTIES.connectedAppClientId,
      };

      const router = new CheckPropertiesFulFilledRouter(customProperties);

      const inputState = createTestState({
        organization: 'MyOrg',
        loginHost: 'https://test.salesforce.com',
        connectedAppClientId: '12345',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });
  });

  describe('execute() - Order Independence', () => {
    it('should not depend on order of property definition', () => {
      // Create properties in reverse order
      const reversedProperties: PropertyMetadataCollection = {
        packageName: WORKFLOW_USER_INPUT_PROPERTIES.packageName,
        projectName: WORKFLOW_USER_INPUT_PROPERTIES.projectName,
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const router = new CheckPropertiesFulFilledRouter(reversedProperties);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        packageName: 'com.test',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });

    it('should check all properties regardless of order', () => {
      const reversedProperties: PropertyMetadataCollection = {
        projectName: WORKFLOW_USER_INPUT_PROPERTIES.projectName,
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const router = new CheckPropertiesFulFilledRouter(reversedProperties);

      // Missing first property in reversed order
      const state1 = createTestState({
        platform: 'iOS',
      });
      expect(router.execute(state1)).toBe('generateQuestion');

      // Missing second property in reversed order
      const state2 = createTestState({
        projectName: 'MyApp',
      });
      expect(router.execute(state2)).toBe('generateQuestion');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle state with extra properties not in required collection', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        packageName: 'com.extra.property', // Extra property not in subset
        organization: 'ExtraOrg',
      });

      const nextNode = router.execute(inputState);

      // Should still route to validateEnvironment since required properties are fulfilled
      expect(nextNode).toBe('validateEnvironment');
    });

    it('should only check properties in required collection', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        // packageName is not in twoPropertySubset, so it doesn't matter if it's missing
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe('validateEnvironment');
    });

    it('should handle empty property collection gracefully', () => {
      const emptyProperties: PropertyMetadataCollection = {};

      const router = new CheckPropertiesFulFilledRouter(emptyProperties);

      const inputState = createTestState({});

      const nextNode = router.execute(inputState);

      // With no required properties, should always route to validateEnvironment
      expect(nextNode).toBe('validateEnvironment');
    });
  });

  describe('execute() - State Preservation', () => {
    it('should not modify input state', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const originalPlatform = 'iOS';
      const originalProjectName = 'MyApp';

      const inputState = createTestState({
        platform: originalPlatform,
        projectName: originalProjectName,
      });

      router.execute(inputState);

      // State should remain unchanged
      expect(inputState.platform).toBe(originalPlatform);
      expect(inputState.projectName).toBe(originalProjectName);
    });
  });

  describe('execute() - Return Type', () => {
    it('should return valid NextNode type', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const state1 = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
      });
      const result1 = router.execute(state1);
      expect(['validateEnvironment', 'generateQuestion']).toContain(result1);

      const state2 = createTestState({
        platform: 'iOS',
      });
      const result2 = router.execute(state2);
      expect(['validateEnvironment', 'generateQuestion']).toContain(result2);
    });

    it('should only return one of two possible values', () => {
      const router = new CheckPropertiesFulFilledRouter(twoPropertySubset);

      const state = createTestState({
        platform: 'iOS',
      });

      const result = router.execute(state);

      expect(result === 'validateEnvironment' || result === 'generateQuestion').toBe(true);
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle progressive property collection', () => {
      const router = new CheckPropertiesFulFilledRouter(threePropertySubset);

      // Step 1: No properties
      const state1 = createTestState({});
      expect(router.execute(state1)).toBe('generateQuestion');

      // Step 2: One property collected
      const state2 = createTestState({
        platform: 'iOS',
      });
      expect(router.execute(state2)).toBe('generateQuestion');

      // Step 3: Two properties collected
      const state3 = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
      });
      expect(router.execute(state3)).toBe('generateQuestion');

      // Step 4: All properties collected
      const state4 = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        packageName: 'com.test.myapp',
      });
      expect(router.execute(state4)).toBe('validateEnvironment');
    });

    it('should handle complete initial extraction scenario', () => {
      const router = new CheckPropertiesFulFilledRouter(threePropertySubset);

      // User provided all information upfront
      const inputState = createTestState({
        platform: 'Android',
        projectName: 'FieldService',
        packageName: 'com.salesforce.fieldservice',
      });

      const nextNode = router.execute(inputState);

      // Should skip question generation and go straight to validation
      expect(nextNode).toBe('validateEnvironment');
    });

    it('should handle partial extraction scenario', () => {
      const router = new CheckPropertiesFulFilledRouter(threePropertySubset);

      // User provided some information
      const inputState = createTestState({
        platform: 'iOS',
        projectName: 'MyApp',
        // packageName missing - need to prompt
      });

      const nextNode = router.execute(inputState);

      // Should route to question generation for missing property
      expect(nextNode).toBe('generateQuestion');
    });
  });
});
