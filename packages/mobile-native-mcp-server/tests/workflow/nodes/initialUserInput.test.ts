/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InitialUserInputNode } from '../../../src/workflow/nodes/initialUserInput.js';
import { MockInputExtractionService } from '../../utils/MockInputExtractionService.js';
import { MockGenerateQuestionService } from '../../utils/MockGenerateQuestionService.js';
import { MockGetInputService } from '../../utils/MockGetInputService.js';
import { createTestState } from '../../utils/stateBuilders.js';
import { WORKFLOW_USER_INPUT_PROPERTIES } from '../../../src/workflow/metadata.js';
import { PropertyMetadataCollection } from '../../../src/common/propertyMetadata.js';

describe('InitialUserInputNode', () => {
  let mockExtractionService: MockInputExtractionService;
  let mockQuestionService: MockGenerateQuestionService;
  let mockInputService: MockGetInputService;

  // Test property subsets for focused testing (no code smells!)
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
    mockQuestionService = new MockGenerateQuestionService();
    mockInputService = new MockGetInputService();
  });

  describe('Node Properties', () => {
    it('should have correct node name', () => {
      const node = new InitialUserInputNode();
      expect(node.name).toBe('triageUserInput');
    });
  });

  describe('Constructor', () => {
    it('should accept custom required properties', () => {
      const customProperties: PropertyMetadataCollection = {
        platform: WORKFLOW_USER_INPUT_PROPERTIES.platform,
      };

      const node = new InitialUserInputNode(customProperties);
      expect(node['requiredProperties']).toBe(customProperties);
    });

    it('should default to WORKFLOW_USER_INPUT_PROPERTIES when no properties provided', () => {
      const node = new InitialUserInputNode();
      expect(node['requiredProperties']).toBe(WORKFLOW_USER_INPUT_PROPERTIES);
    });

    it('should accept all three custom services', () => {
      const node = new InitialUserInputNode(
        undefined, // use default properties
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );
      expect(node['extractionService']).toBe(mockExtractionService);
      expect(node['generateQuestionService']).toBe(mockQuestionService);
      expect(node['getInputService']).toBe(mockInputService);
    });

    it('should create default services when none provided', () => {
      const node = new InitialUserInputNode();
      expect(node['extractionService']).toBeDefined();
      expect(node['generateQuestionService']).toBeDefined();
      expect(node['getInputService']).toBeDefined();
    });

    it('should allow partial service injection with custom properties', () => {
      const customExtraction = new MockInputExtractionService();
      const customProperties = twoPropertySubset;

      const node = new InitialUserInputNode(customProperties, customExtraction);

      expect(node['requiredProperties']).toBe(customProperties);
      expect(node['extractionService']).toBe(customExtraction);
      expect(node['generateQuestionService']).toBeDefined();
      expect(node['getInputService']).toBeDefined();
    });
  });

  describe('execute() - Complete Initial Extraction (No Prompting)', () => {
    it('should extract all properties from initial input without prompting', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'Create MyApp for iOS',
      });

      // Mock successful extraction of ALL required properties
      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'iOS',
          projectName: 'MyApp',
        },
      });

      const result = node.execute(inputState);

      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('MyApp');

      // Should NOT have prompted (all properties extracted initially)
      expect(mockQuestionService.getCallHistory()).toHaveLength(0);
      expect(mockInputService.getCallHistory()).toHaveLength(0);
    });

    it('should extract subset of properties from initial input', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'Create MyApp for Android, package com.test.myapp',
      });

      // All properties extracted
      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'Android',
          projectName: 'MyApp',
          packageName: 'com.test.myapp',
        },
      });

      const result = node.execute(inputState);

      expect(result.platform).toBe('Android');
      expect(result.projectName).toBe('MyApp');
      expect(result.packageName).toBe('com.test.myapp');

      // No prompting needed
      expect(mockQuestionService.getCallHistory()).toHaveLength(0);
    });
  });

  describe('execute() - Multi-Turn Interaction (Prompting for Missing Properties)', () => {
    it('should prompt for single missing property', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'iOS app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = (_userInput, properties) => {
        extractionCallCount++;
        if (extractionCallCount === 1) {
          // Initial: only platform extracted
          return { extractedProperties: { platform: 'iOS' } };
        }
        // Second call: projectName provided in response
        const propertyNames = Object.keys(properties);
        if (propertyNames.includes('projectName')) {
          return { extractedProperties: { projectName: 'MyApp' } };
        }
        return { extractedProperties: {} };
      };

      mockQuestionService.setQuestion('What is the project name?');
      mockInputService.setUserInput('MyApp');

      const result = node.execute(inputState);

      // Both properties should be collected
      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('MyApp');

      // Should have prompted exactly once for the missing property
      expect(mockQuestionService.getCallHistory()).toHaveLength(1);
      expect(mockInputService.getCallHistory()).toHaveLength(1);
    });

    it('should prompt for multiple missing properties sequentially', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'Android app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = (_userInput, properties) => {
        extractionCallCount++;
        if (extractionCallCount === 1) {
          // Initial: only platform
          return { extractedProperties: { platform: 'Android' } };
        }

        // Handle prompts for missing properties
        const propertyNames = Object.keys(properties);
        if (propertyNames.includes('projectName')) {
          return { extractedProperties: { projectName: 'TestApp' } };
        }
        if (propertyNames.includes('packageName')) {
          return { extractedProperties: { packageName: 'com.test.app' } };
        }
        return { extractedProperties: {} };
      };

      const result = node.execute(inputState);

      // All properties should be collected
      expect(result.platform).toBe('Android');
      expect(result.projectName).toBe('TestApp');
      expect(result.packageName).toBe('com.test.app');

      // Should have prompted for 2 missing properties
      expect(mockQuestionService.getCallHistory()).toHaveLength(2);
      expect(mockInputService.getCallHistory()).toHaveLength(2);
    });

    it('should handle user providing multiple properties in one response', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'mobile app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = (_userInput, _properties) => {
        extractionCallCount++;
        if (extractionCallCount === 1) {
          // Initial: nothing extracted
          return { extractedProperties: {} };
        }

        // User provides all 3 properties in response to first prompt
        // The implementation now passes all unfulfilled properties, so this works!
        if (extractionCallCount === 2) {
          return {
            extractedProperties: {
              platform: 'iOS',
              projectName: 'SuperApp',
              packageName: 'com.super.app',
            },
          };
        }

        // Shouldn't reach subsequent extractions since all properties were collected
        return { extractedProperties: {} };
      };

      mockInputService.setUserInput('iOS app called SuperApp with package com.super.app');

      const result = node.execute(inputState);

      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('SuperApp');
      expect(result.packageName).toBe('com.super.app');

      // Should have prompted only once - user provided all answers in first response
      // This is the UX win: eager users can skip ahead!
      expect(mockQuestionService.getCallHistory()).toHaveLength(1);
      expect(mockInputService.getCallHistory()).toHaveLength(1);
    });

    it('should handle empty initial extraction and collect all via prompting', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'unclear input',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = (_userInput, properties) => {
        extractionCallCount++;
        if (extractionCallCount === 1) {
          // Initial: nothing
          return { extractedProperties: {} };
        }

        // Subsequent prompts
        const propertyNames = Object.keys(properties);
        if (propertyNames.includes('platform')) {
          return { extractedProperties: { platform: 'Android' } };
        }
        if (propertyNames.includes('projectName')) {
          return { extractedProperties: { projectName: 'MyProject' } };
        }
        return { extractedProperties: {} };
      };

      const result = node.execute(inputState);

      expect(result.platform).toBe('Android');
      expect(result.projectName).toBe('MyProject');

      // Should have prompted for both properties
      expect(mockQuestionService.getCallHistory()).toHaveLength(2);
    });
  });

  describe('execute() - Edge Cases in Multi-Turn Flow', () => {
    it('should retry when user provides invalid response', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'app',
      });

      let extractionCallCount = 0;
      const collectedProps: Record<string, unknown> = {};
      mockExtractionService.extractProperties = (_userInput, properties) => {
        extractionCallCount++;

        if (extractionCallCount === 1) {
          return { extractedProperties: {} };
        }

        const propertyNames = Object.keys(properties);

        // First prompt for platform: user gives invalid response
        if (extractionCallCount === 2 && propertyNames.includes('platform')) {
          return { extractedProperties: {} }; // Failed extraction
        }

        // Second iteration: platform succeeds
        if (
          extractionCallCount > 2 &&
          propertyNames.includes('platform') &&
          !collectedProps.platform
        ) {
          collectedProps.platform = 'iOS';
          return { extractedProperties: { platform: 'iOS' } };
        }

        // projectName succeeds first try
        if (propertyNames.includes('projectName') && !collectedProps.projectName) {
          collectedProps.projectName = 'MyApp';
          return { extractedProperties: { projectName: 'MyApp' } };
        }

        return { extractedProperties: {} };
      };

      const result = node.execute(inputState);

      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('MyApp');

      // Should have prompted multiple times due to retry
      expect(mockQuestionService.getCallHistory().length).toBeGreaterThan(2);
    });

    it('should pass correct metadata to question generation service', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'app',
      });

      mockExtractionService.setResult({ extractedProperties: {} });

      let callCount = 0;
      mockExtractionService.extractProperties = () => {
        callCount++;
        if (callCount === 1) {
          return { extractedProperties: {} };
        }
        // Return all properties after first prompt
        return {
          extractedProperties: {
            platform: 'iOS',
            projectName: 'Test',
          },
        };
      };

      node.execute(inputState);

      const questionCalls = mockQuestionService.getCallHistory();
      expect(questionCalls.length).toBeGreaterThan(0);

      // Verify metadata passed includes property information
      const platformCall = questionCalls.find(call => call.name === 'platform');
      expect(platformCall).toBeDefined();
      expect(platformCall?.metadata.friendlyName).toBe('mobile platform');
      expect(platformCall?.metadata.description).toContain('platform');
    });

    it('should pass generated question to input service', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'app',
      });

      const customQuestion = 'What platform would you like to target?';
      mockQuestionService.setQuestion(customQuestion);

      let callCount = 0;
      mockExtractionService.extractProperties = () => {
        callCount++;
        if (callCount === 1) {
          return { extractedProperties: {} };
        }
        return {
          extractedProperties: {
            platform: 'Android',
            projectName: 'App',
          },
        };
      };

      node.execute(inputState);

      const inputCalls = mockInputService.getCallHistory();
      expect(inputCalls.length).toBeGreaterThan(0);
      expect(inputCalls[0].question).toBe(customQuestion);
    });
  });

  describe('execute() - Service Integration', () => {
    it('should call extraction service with initial input and required properties', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const userInput = 'test input';
      const inputState = createTestState({ userInput });

      mockExtractionService.setResult({
        extractedProperties: {
          platform: 'iOS',
          projectName: 'Test',
        },
      });

      node.execute(inputState);

      const calls = mockExtractionService.getCallHistory();
      expect(calls.length).toBeGreaterThanOrEqual(1);

      const firstCall = calls[0];
      expect(firstCall.userInput).toBe(userInput);
      expect(firstCall.properties).toBe(twoPropertySubset);
    });

    it('should call extraction service for each user response during prompting', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'create app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = () => {
        extractionCallCount++;

        if (extractionCallCount === 1) {
          return { extractedProperties: { platform: 'iOS' } };
        } else if (extractionCallCount === 2) {
          return { extractedProperties: { projectName: 'TestApp' } };
        } else {
          return { extractedProperties: { packageName: 'com.test' } };
        }
      };

      node.execute(inputState);

      // Should have made 3 extraction calls (initial + 2 prompts)
      expect(extractionCallCount).toBe(3);
    });

    it('should maintain extracted properties across multiple prompting iterations', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'iOS app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = () => {
        extractionCallCount++;

        if (extractionCallCount === 1) {
          return { extractedProperties: { platform: 'iOS' } };
        } else if (extractionCallCount === 2) {
          return { extractedProperties: { projectName: 'MyApp' } };
        } else {
          return { extractedProperties: { packageName: 'com.test' } };
        }
      };

      const result = node.execute(inputState);

      // All properties collected across iterations should be present
      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('MyApp');
      expect(result.packageName).toBe('com.test');
    });
  });

  describe('execute() - Return Value', () => {
    it('should return flat object with all extracted properties', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

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

      // Should be plain object (not nested)
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('projectName');
      expect(result).not.toHaveProperty('extractedProperties');
    });

    it('should include properties from both initial extraction and prompting', () => {
      const node = new InitialUserInputNode(
        twoPropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'iOS app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = () => {
        extractionCallCount++;

        if (extractionCallCount === 1) {
          return { extractedProperties: { platform: 'iOS' } };
        }
        return { extractedProperties: { projectName: 'MyApp' } };
      };

      const result = node.execute(inputState);

      // Should include property from initial extraction
      expect(result.platform).toBe('iOS');

      // Should include property from prompting
      expect(result.projectName).toBe('MyApp');
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle complete natural language workflow', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

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

      // Should not need any prompting
      expect(mockQuestionService.getCallHistory()).toHaveLength(0);
    });

    it('should handle progressive disclosure pattern', () => {
      const node = new InitialUserInputNode(
        threePropertySubset,
        mockExtractionService,
        mockQuestionService,
        mockInputService
      );

      const inputState = createTestState({
        userInput: 'mobile app',
      });

      let extractionCallCount = 0;
      mockExtractionService.extractProperties = () => {
        extractionCallCount++;

        // User provides one piece at a time through prompts
        if (extractionCallCount === 1) return { extractedProperties: {} };
        if (extractionCallCount === 2) return { extractedProperties: { platform: 'iOS' } };
        if (extractionCallCount === 3) return { extractedProperties: { projectName: 'MyApp' } };
        return { extractedProperties: { packageName: 'com.test.myapp' } };
      };

      const result = node.execute(inputState);

      expect(result.platform).toBe('iOS');
      expect(result.projectName).toBe('MyApp');
      expect(result.packageName).toBe('com.test.myapp');

      // Should have prompted 3 times (once for each property)
      expect(mockQuestionService.getCallHistory()).toHaveLength(3);
    });
  });
});
