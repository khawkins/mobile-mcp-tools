/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect } from 'vitest';
import { Annotation, StateType, StateDefinition } from '@langchain/langgraph';
import { BaseNode } from '../../src/nodes/abstractBaseNode.js';

// Define test state types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SimpleState = Annotation.Root({
  count: Annotation<number>,
  message: Annotation<string>,
});

type SimpleStateType = typeof SimpleState.State;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ComplexState = Annotation.Root({
  users: Annotation<string[]>,
  metadata: Annotation<Record<string, unknown>>,
  isComplete: Annotation<boolean>,
});

type ComplexStateType = typeof ComplexState.State;

/**
 * Test node with default state type
 */
class DefaultStateNode extends BaseNode {
  execute = (state: StateType<StateDefinition>): Partial<StateType<StateDefinition>> => {
    return state;
  };
}

/**
 * Test node with simple custom state
 */
class SimpleStateNode extends BaseNode<SimpleStateType> {
  execute = (state: SimpleStateType): Partial<SimpleStateType> => {
    return {
      count: state.count + 1,
      message: `Count is now ${state.count + 1}`,
    };
  };
}

/**
 * Test node with complex custom state
 */
class ComplexStateNode extends BaseNode<ComplexStateType> {
  execute = (state: ComplexStateType): Partial<ComplexStateType> => {
    return {
      users: ['newUser'],
      metadata: { ...state.metadata, lastUpdate: Date.now() },
      isComplete: state.users.length >= 5,
    };
  };
}

describe('BaseNode', () => {
  describe('Constructor', () => {
    it('should initialize with provided name', () => {
      const node = new DefaultStateNode('testNode');
      expect(node.name).toBe('testNode');
    });

    it('should work with custom state type', () => {
      const node = new SimpleStateNode('simpleNode');
      expect(node.name).toBe('simpleNode');
    });
  });

  describe('Type Safety - Default State Type', () => {
    it('should accept default StateType<StateDefinition>', () => {
      const node = new DefaultStateNode('defaultNode');

      // Default state can be any object
      const state: StateType<StateDefinition> = { anyField: 'value' };
      const result = node.execute(state);

      expect(result).toEqual(state);
    });

    it('should allow returning partial state', () => {
      class PartialStateNode extends BaseNode {
        execute = (_state: StateType<StateDefinition>) => {
          // Can return partial state
          return { someField: 'updated' };
        };
      }

      const node = new PartialStateNode('partialNode');
      const state = { someField: 'original', otherField: 'unchanged' };
      const result = node.execute(state);

      expect(result).toEqual({ someField: 'updated' });
    });
  });

  describe('Type Safety - Simple Custom State', () => {
    it('should enforce simple state structure', () => {
      const node = new SimpleStateNode('simpleNode');
      const state: SimpleStateType = {
        count: 5,
        message: 'Hello',
      };

      const result = node.execute(state);

      expect(result).toEqual({
        count: 6,
        message: 'Count is now 6',
      });
    });

    it('should allow returning partial simple state', () => {
      class PartialSimpleNode extends BaseNode<SimpleStateType> {
        execute = (state: SimpleStateType): Partial<SimpleStateType> => {
          // Can return only count
          return { count: state.count + 1 };
        };
      }

      const node = new PartialSimpleNode('partialSimpleNode');
      const state: SimpleStateType = { count: 10, message: 'Test' };
      const result = node.execute(state);

      expect(result).toEqual({ count: 11 });
      expect(result.message).toBeUndefined();
    });

    it('should allow returning empty partial state', () => {
      class NoOpNode extends BaseNode<SimpleStateType> {
        execute = (_state: SimpleStateType): Partial<SimpleStateType> => {
          return {};
        };
      }

      const node = new NoOpNode('noOpNode');
      const state: SimpleStateType = { count: 5, message: 'Test' };
      const result = node.execute(state);

      expect(result).toEqual({});
    });
  });

  describe('Type Safety - Complex Custom State', () => {
    it('should enforce complex state structure with arrays', () => {
      const node = new ComplexStateNode('complexNode');
      const state: ComplexStateType = {
        users: ['user1', 'user2'],
        metadata: { startTime: Date.now() },
        isComplete: false,
      };

      const result = node.execute(state);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('isComplete');
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.isComplete).toBe(false); // Less than 5 users
    });

    it('should handle state with multiple users', () => {
      const node = new ComplexStateNode('complexNode');
      const state: ComplexStateType = {
        users: ['user1', 'user2', 'user3', 'user4', 'user5'],
        metadata: {},
        isComplete: false,
      };

      const result = node.execute(state);

      expect(result.isComplete).toBe(true); // 5 or more users
      expect(result.users).toEqual(['newUser']);
    });

    it('should allow returning partial complex state', () => {
      class PartialComplexNode extends BaseNode<ComplexStateType> {
        execute = (_state: ComplexStateType): Partial<ComplexStateType> => {
          // Can return only isComplete
          return { isComplete: true };
        };
      }

      const node = new PartialComplexNode('partialComplexNode');
      const state: ComplexStateType = {
        users: ['user1'],
        metadata: {},
        isComplete: false,
      };
      const result = node.execute(state);

      expect(result).toEqual({ isComplete: true });
      expect(result.users).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });
  });

  describe('Composition and Reusability', () => {
    it('should allow multiple nodes to share the same state type', () => {
      class IncrementNode extends BaseNode<SimpleStateType> {
        execute = (state: SimpleStateType) => ({
          count: state.count + 1,
        });
      }

      class DoubleNode extends BaseNode<SimpleStateType> {
        execute = (state: SimpleStateType) => ({
          count: state.count * 2,
        });
      }

      class MessageNode extends BaseNode<SimpleStateType> {
        execute = (state: SimpleStateType) => ({
          message: `Count is ${state.count}`,
        });
      }

      const incrementNode = new IncrementNode('increment');
      const doubleNode = new DoubleNode('double');
      const messageNode = new MessageNode('message');

      const state: SimpleStateType = { count: 5, message: '' };

      // Simulate workflow: increment -> double -> message
      const afterIncrement = { ...state, ...incrementNode.execute(state) };
      expect(afterIncrement.count).toBe(6);

      const afterDouble = { ...afterIncrement, ...doubleNode.execute(afterIncrement) };
      expect(afterDouble.count).toBe(12);

      const afterMessage = { ...afterDouble, ...messageNode.execute(afterDouble) };
      expect(afterMessage.message).toBe('Count is 12');
    });

    it('should support conditional node execution', () => {
      class ConditionalNode extends BaseNode<SimpleStateType> {
        constructor(
          name: string,
          private threshold: number
        ) {
          super(name);
        }

        execute = (state: SimpleStateType): Partial<SimpleStateType> => {
          if (state.count > this.threshold) {
            return {
              message: 'Threshold exceeded',
              count: 0,
            };
          }
          return {
            count: state.count + 1,
          };
        };
      }

      const node = new ConditionalNode('conditional', 10);

      // Below threshold
      const state1: SimpleStateType = { count: 5, message: '' };
      const result1 = node.execute(state1);
      expect(result1.count).toBe(6);
      expect(result1.message).toBeUndefined();

      // Above threshold
      const state2: SimpleStateType = { count: 15, message: '' };
      const result2 = node.execute(state2);
      expect(result2.count).toBe(0);
      expect(result2.message).toBe('Threshold exceeded');
    });
  });

  describe('Node Identity', () => {
    it('should maintain unique names for multiple instances', () => {
      const node1 = new SimpleStateNode('node1');
      const node2 = new SimpleStateNode('node2');
      const node3 = new SimpleStateNode('node1'); // Same name as node1

      expect(node1.name).toBe('node1');
      expect(node2.name).toBe('node2');
      expect(node3.name).toBe('node1');
      expect(node1).not.toBe(node3); // Different instances
    });

    it('should allow querying node by name', () => {
      const nodes = [
        new SimpleStateNode('increment'),
        new SimpleStateNode('decrement'),
        new SimpleStateNode('reset'),
      ];

      const foundNode = nodes.find(node => node.name === 'decrement');
      expect(foundNode).toBeDefined();
      expect(foundNode?.name).toBe('decrement');
    });
  });
});
