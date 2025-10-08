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

describe('GetUserInputNode', () => {
  let mockInputService: MockGetInputService;

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
    it('should accept custom input service', () => {
      const node = new GetUserInputNode(mockInputService);
      expect(node['getInputService']).toBe(mockInputService);
    });

    it('should create default input service when none provided', () => {
      const node = new GetUserInputNode();
      expect(node['getInputService']).toBeDefined();
    });
  });

  describe('execute() - User Input Collection', () => {
    it('should collect user input using the question from state', () => {
      const node = new GetUserInputNode(mockInputService);

      const question = 'What platform would you like to target?';
      const inputState = createTestState({
        userInputQuestion: question,
      });

      const userResponse = 'iOS';
      mockInputService.setUserInput(userResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(userResponse);

      // Verify service was called with correct question
      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(1);
      expect(calls[0].question).toBe(question);
    });

    it('should handle text user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Enter project name:',
      });

      mockInputService.setUserInput('MyAwesomeApp');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('MyAwesomeApp');
    });

    it('should handle structured user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Provide app details:',
      });

      const structuredResponse = {
        projectName: 'MyApp',
        packageName: 'com.example.myapp',
      };
      mockInputService.setUserInput(structuredResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toEqual(structuredResponse);
    });

    it('should handle numeric user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Enter port number:',
      });

      mockInputService.setUserInput(8080);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(8080);
    });

    it('should handle boolean user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Enable debug mode?',
      });

      mockInputService.setUserInput(true);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(true);
    });

    it('should handle null user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Optional field:',
      });

      mockInputService.setUserInput(null);

      const result = node.execute(inputState);

      expect(result.userInput).toBeNull();
    });
  });

  describe('execute() - Service Integration', () => {
    it('should call input service exactly once', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Test question?',
      });

      mockInputService.setUserInput('test response');

      node.execute(inputState);

      expect(mockInputService.getCallHistory()).toHaveLength(1);
    });

    it('should pass the exact question from state to input service', () => {
      const node = new GetUserInputNode(mockInputService);

      const exactQuestion = 'What is the package identifier for your mobile app?';
      const inputState = createTestState({
        userInputQuestion: exactQuestion,
      });

      mockInputService.setUserInput('com.test');

      node.execute(inputState);

      const lastCall = mockInputService.getLastCall();
      expect(lastCall?.question).toBe(exactQuestion);
    });

    it('should work with different questions in sequence', () => {
      const node = new GetUserInputNode(mockInputService);

      // First call
      const state1 = createTestState({
        userInputQuestion: 'Question 1?',
      });
      mockInputService.setUserInput('Answer 1');
      const result1 = node.execute(state1);

      // Second call
      const state2 = createTestState({
        userInputQuestion: 'Question 2?',
      });
      mockInputService.setUserInput('Answer 2');
      const result2 = node.execute(state2);

      expect(result1.userInput).toBe('Answer 1');
      expect(result2.userInput).toBe('Answer 2');

      const calls = mockInputService.getCallHistory();
      expect(calls).toHaveLength(2);
      expect(calls[0].question).toBe('Question 1?');
      expect(calls[1].question).toBe('Question 2?');
    });
  });

  describe('execute() - Return Value', () => {
    it('should return object with userInput property', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Test?',
      });

      mockInputService.setUserInput('test');

      const result = node.execute(inputState);

      expect(result).toHaveProperty('userInput');
      expect(result.userInput).toBe('test');
    });

    it('should return Partial<State> compatible object', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Test?',
      });

      mockInputService.setUserInput('test');

      const result = node.execute(inputState);

      // Result should be compatible with Partial<State>
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      expect('userInput' in result).toBe(true);
    });

    it('should only include userInput in return value', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Test?',
      });

      mockInputService.setUserInput('test');

      const result = node.execute(inputState);

      // Should only have userInput property
      const keys = Object.keys(result);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('userInput');
    });

    it('should preserve the type of user input in return value', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Test?',
      });

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
    it('should handle empty question string', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: '',
      });

      mockInputService.setUserInput('response');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('response');

      const lastCall = mockInputService.getLastCall();
      expect(lastCall?.question).toBe('');
    });

    it('should handle long question strings', () => {
      const node = new GetUserInputNode(mockInputService);

      const longQuestion = 'A'.repeat(1000);
      const inputState = createTestState({
        userInputQuestion: longQuestion,
      });

      mockInputService.setUserInput('response');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('response');

      const lastCall = mockInputService.getLastCall();
      expect(lastCall?.question).toBe(longQuestion);
    });

    it('should handle questions with special characters', () => {
      const node = new GetUserInputNode(mockInputService);

      const specialQuestion = 'What is your package? (e.g., com.example.app) [required]';
      const inputState = createTestState({
        userInputQuestion: specialQuestion,
      });

      mockInputService.setUserInput('com.test.app');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('com.test.app');

      const lastCall = mockInputService.getLastCall();
      expect(lastCall?.question).toBe(specialQuestion);
    });

    it('should handle empty string user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Optional field:',
      });

      mockInputService.setUserInput('');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('');
    });

    it('should handle undefined user responses', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Test?',
      });

      mockInputService.setUserInput(undefined);

      const result = node.execute(inputState);

      expect(result.userInput).toBeUndefined();
    });
  });

  describe('execute() - State Preservation', () => {
    it('should not modify input state', () => {
      const node = new GetUserInputNode(mockInputService);

      const originalQuestion = 'Original question?';
      const inputState = createTestState({
        userInputQuestion: originalQuestion,
        platform: 'iOS',
      });

      mockInputService.setUserInput('response');

      node.execute(inputState);

      // Input state should remain unchanged
      expect(inputState.userInputQuestion).toBe(originalQuestion);
      expect(inputState.platform).toBe('iOS');
      // userInput should not be set on input state
      expect(inputState.userInput).not.toBe('response');
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle platform selection question', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'Which mobile platform would you like to target (iOS or Android)?',
      });

      mockInputService.setUserInput('iOS');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('iOS');
    });

    it('should handle project name question', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'What is the name of your mobile app project?',
      });

      mockInputService.setUserInput('FieldServiceApp');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('FieldServiceApp');
    });

    it('should handle package identifier question', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion:
          'What is the package identifier for your app (e.g., com.company.appname)?',
      });

      mockInputService.setUserInput('com.salesforce.fieldservice');

      const result = node.execute(inputState);

      expect(result.userInput).toBe('com.salesforce.fieldservice');
    });

    it('should handle multi-property response', () => {
      const node = new GetUserInputNode(mockInputService);

      const inputState = createTestState({
        userInputQuestion: 'What platform would you like?',
      });

      // User provides extra information
      const detailedResponse = 'iOS platform with project name MyApp';
      mockInputService.setUserInput(detailedResponse);

      const result = node.execute(inputState);

      expect(result.userInput).toBe(detailedResponse);
    });
  });
});
