/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect } from 'vitest';
import { CheckEnvironmentValidatedRouter } from '../../../src/workflow/nodes/checkEnvironmentValidated.js';
import { createTestState } from '../../utils/stateBuilders.js';

describe('CheckEnvironmentValidatedRouter', () => {
  // Test node names
  const VALID_ENV_NODE = 'userInputExtraction';
  const INVALID_ENV_NODE = 'workflowFailure';

  describe('Constructor', () => {
    it('should accept environment validated and invalid environment node names', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);
      expect(router['environmentValidatedNodeName']).toBe(VALID_ENV_NODE);
      expect(router['invalidEnvironmentNodeName']).toBe(INVALID_ENV_NODE);
    });

    it('should allow different node names for valid and invalid environment', () => {
      const router1 = new CheckEnvironmentValidatedRouter('continueWorkflow', 'failWorkflow');
      expect(router1['environmentValidatedNodeName']).toBe('continueWorkflow');
      expect(router1['invalidEnvironmentNodeName']).toBe('failWorkflow');

      const router2 = new CheckEnvironmentValidatedRouter('nextStep', 'errorHandler');
      expect(router2['environmentValidatedNodeName']).toBe('nextStep');
      expect(router2['invalidEnvironmentNodeName']).toBe('errorHandler');
    });
  });

  describe('execute() - Routing Logic', () => {
    it('should route to valid environment node when validEnvironment is true', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: true,
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(VALID_ENV_NODE);
    });

    it('should route to invalid environment node when validEnvironment is false', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: ['Environment variable not set'],
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(INVALID_ENV_NODE);
    });

    it('should route to invalid environment node when validEnvironment is undefined', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: undefined,
      });

      const nextNode = router.execute(inputState);

      // Undefined is falsy, so should route to invalid environment node
      expect(nextNode).toBe(INVALID_ENV_NODE);
    });
  });

  describe('execute() - Different Environment Validation Scenarios', () => {
    it('should route to valid node when environment is completely valid', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: true,
        connectedAppClientId: 'test-client-id',
        connectedAppCallbackUri: 'myapp://callback',
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(VALID_ENV_NODE);
    });

    it('should route to invalid node when environment validation fails', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: [
          'CONNECTED_APP_CONSUMER_KEY environment variable not set',
          'CONNECTED_APP_CALLBACK_URL environment variable not set',
        ],
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(INVALID_ENV_NODE);
    });

    it('should route to invalid node with single error message', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: ['CONNECTED_APP_CONSUMER_KEY environment variable not set'],
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(INVALID_ENV_NODE);
    });

    it('should route to invalid node with multiple error messages', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: [
          'Missing environment variable A',
          'Missing environment variable B',
          'Missing environment variable C',
        ],
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(INVALID_ENV_NODE);
    });
  });

  describe('execute() - Custom Node Names', () => {
    it('should return custom valid environment node name', () => {
      const customValidNode = 'customUserInputExtraction';
      const router = new CheckEnvironmentValidatedRouter(customValidNode, 'someOtherNode');

      const inputState = createTestState({
        validEnvironment: true,
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(customValidNode);
    });

    it('should return custom invalid environment node name', () => {
      const customInvalidNode = 'customFailureHandler';
      const router = new CheckEnvironmentValidatedRouter('someNode', customInvalidNode);

      const inputState = createTestState({
        validEnvironment: false,
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(customInvalidNode);
    });

    it('should work with workflow-like node names', () => {
      const router = new CheckEnvironmentValidatedRouter('userInputExtraction', 'workflowFailure');

      const validState = createTestState({
        validEnvironment: true,
      });
      expect(router.execute(validState)).toBe('userInputExtraction');

      const invalidState = createTestState({
        validEnvironment: false,
      });
      expect(router.execute(invalidState)).toBe('workflowFailure');
    });
  });

  describe('execute() - State Preservation', () => {
    it('should not modify input state', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const originalValidEnvironment = true;
      const originalMessages = ['test message'];

      const inputState = createTestState({
        validEnvironment: originalValidEnvironment,
        invalidEnvironmentMessages: originalMessages,
      });

      router.execute(inputState);

      // State should remain unchanged
      expect(inputState.validEnvironment).toBe(originalValidEnvironment);
      expect(inputState.invalidEnvironmentMessages).toBe(originalMessages);
    });

    it('should not mutate invalidEnvironmentMessages array', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const originalMessages = ['message 1', 'message 2'];
      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: originalMessages,
      });

      router.execute(inputState);

      // Array should remain unchanged
      expect(inputState.invalidEnvironmentMessages).toEqual(originalMessages);
      expect(inputState.invalidEnvironmentMessages?.length).toBe(2);
    });
  });

  describe('execute() - Return Type', () => {
    it('should return valid node name string', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const state1 = createTestState({
        validEnvironment: true,
      });
      const result1 = router.execute(state1);
      expect(typeof result1).toBe('string');
      expect([VALID_ENV_NODE, INVALID_ENV_NODE]).toContain(result1);

      const state2 = createTestState({
        validEnvironment: false,
      });
      const result2 = router.execute(state2);
      expect(typeof result2).toBe('string');
      expect([VALID_ENV_NODE, INVALID_ENV_NODE]).toContain(result2);
    });

    it('should only return one of two possible node names', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const state = createTestState({
        validEnvironment: true,
      });

      const result = router.execute(state);

      expect(result === VALID_ENV_NODE || result === INVALID_ENV_NODE).toBe(true);
    });
  });

  describe('execute() - Real World Scenarios', () => {
    it('should handle environment validation success scenario', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      // Environment variables properly configured
      const inputState = createTestState({
        validEnvironment: true,
        connectedAppClientId: '3MVG9Kip4IKAZQEXPNwTYYd.example',
        connectedAppCallbackUri: 'myapp://oauth/callback',
      });

      const nextNode = router.execute(inputState);

      // Should proceed to user input extraction
      expect(nextNode).toBe(VALID_ENV_NODE);
    });

    it('should handle missing environment variables scenario', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      // Environment validation failed
      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: [
          'You must set the CONNECTED_APP_CONSUMER_KEY environment variable',
          'You must set the CONNECTED_APP_CALLBACK_URL environment variable',
        ],
      });

      const nextNode = router.execute(inputState);

      // Should route to failure node to inform user
      expect(nextNode).toBe(INVALID_ENV_NODE);
    });

    it('should match production graph configuration', () => {
      // This tests the actual node names used in graph.ts
      const router = new CheckEnvironmentValidatedRouter('userInputExtraction', 'workflowFailure');

      // Valid environment - should route to userInputExtraction
      const validState = createTestState({
        validEnvironment: true,
      });
      expect(router.execute(validState)).toBe('userInputExtraction');

      // Invalid environment - should route to workflowFailure
      const invalidState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: ['Environment validation failed'],
      });
      expect(router.execute(invalidState)).toBe('workflowFailure');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle state with null validEnvironment', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: null as unknown as boolean,
      });

      const nextNode = router.execute(inputState);

      // Null is falsy, should route to invalid environment node
      expect(nextNode).toBe(INVALID_ENV_NODE);
    });

    it('should handle state with empty invalidEnvironmentMessages array', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: false,
        invalidEnvironmentMessages: [],
      });

      const nextNode = router.execute(inputState);

      // Even with empty messages array, should still route to invalid node if validEnvironment is false
      expect(nextNode).toBe(INVALID_ENV_NODE);
    });

    it('should not depend on presence of invalidEnvironmentMessages for routing', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      // Router should only check validEnvironment flag, not the messages
      const stateWithoutMessages = createTestState({
        validEnvironment: true,
        // No invalidEnvironmentMessages set
      });

      const nextNode = router.execute(stateWithoutMessages);

      expect(nextNode).toBe(VALID_ENV_NODE);
    });
  });

  describe('execute() - Boolean Coercion', () => {
    it('should treat any truthy value as valid environment', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      const inputState = createTestState({
        validEnvironment: true,
      });

      const nextNode = router.execute(inputState);

      expect(nextNode).toBe(VALID_ENV_NODE);
    });

    it('should treat any falsy value as invalid environment', () => {
      const router = new CheckEnvironmentValidatedRouter(VALID_ENV_NODE, INVALID_ENV_NODE);

      // Test with false
      const state1 = createTestState({
        validEnvironment: false,
      });
      expect(router.execute(state1)).toBe(INVALID_ENV_NODE);

      // Test with undefined
      const state2 = createTestState({
        validEnvironment: undefined,
      });
      expect(router.execute(state2)).toBe(INVALID_ENV_NODE);

      // Test with null (coerced to falsy)
      const state3 = createTestState({
        validEnvironment: null as unknown as boolean,
      });
      expect(router.execute(state3)).toBe(INVALID_ENV_NODE);
    });
  });
});
