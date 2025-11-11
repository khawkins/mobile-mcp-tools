/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RunnableConfig } from '@langchain/core/runnables';
import { Checkpoint, CheckpointMetadata, CheckpointTuple } from '@langchain/langgraph';
import { CheckpointListOptions, PendingWrite } from '@langchain/langgraph-checkpoint';
import { JsonCheckpointSaver } from '../../src/checkpointing/jsonCheckpointer.js';

describe('JsonCheckpointSaver', () => {
  let checkpointer: JsonCheckpointSaver;
  let mockConfig: RunnableConfig;
  let mockCheckpoint: Checkpoint;
  let mockMetadata: CheckpointMetadata;

  beforeEach(() => {
    checkpointer = new JsonCheckpointSaver();

    mockConfig = {
      configurable: {
        thread_id: 'test-thread-123',
        checkpoint_id: 'checkpoint-456',
      },
    };

    mockCheckpoint = {
      id: 'checkpoint-456',
      ts: '2025-01-01T00:00:00.000Z',
      v: 1,
      channel_values: {
        messages: [{ role: 'user', content: 'Hello' }],
        userInput: 'test input',
      },
      channel_versions: {
        messages: 1,
        userInput: 1,
      },
      versions_seen: {
        node1: { messages: 1 },
      },
    };

    mockMetadata = {
      source: 'input',
      step: 1,
      parents: {},
    };
  });

  describe('put() and getTuple()', () => {
    it('should store and retrieve a checkpoint', async () => {
      // Store a checkpoint
      const resultConfig = await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      expect(resultConfig.configurable?.thread_id).toBe('test-thread-123');
      expect(resultConfig.configurable?.checkpoint_id).toBe('checkpoint-456');

      // Retrieve the checkpoint
      const tuple = await checkpointer.getTuple(mockConfig);

      expect(tuple).toBeDefined();
      expect(tuple?.checkpoint.id).toBe(mockCheckpoint.id);
      expect(tuple?.checkpoint.ts).toBe(mockCheckpoint.ts);
      expect(tuple?.checkpoint.channel_values).toEqual(mockCheckpoint.channel_values);
      expect(tuple?.metadata).toEqual(mockMetadata);
      expect(tuple?.config.configurable?.thread_id).toBe('test-thread-123');
    });

    it('should return the latest checkpoint when multiple checkpoints exist', async () => {
      // Store first checkpoint
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      // Store second checkpoint
      const secondCheckpoint = {
        ...mockCheckpoint,
        id: 'checkpoint-789',
        ts: '2025-01-01T01:00:00.000Z',
      };
      const secondConfig = {
        ...mockConfig,
        configurable: { ...mockConfig.configurable, checkpoint_id: 'checkpoint-789' },
      };
      const secondMetadata = { ...mockMetadata, step: 2 };

      await checkpointer.put(secondConfig, secondCheckpoint, secondMetadata);

      // Should retrieve the latest (second) checkpoint
      const tuple = await checkpointer.getTuple({
        configurable: { thread_id: 'test-thread-123' },
      });

      expect(tuple?.checkpoint.id).toBe('checkpoint-789');
      expect(tuple?.metadata?.step).toBe(2);
    });

    it('should handle parent-child checkpoint relationships', async () => {
      // Store parent checkpoint
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      // Store child checkpoint with parent
      const childCheckpoint = {
        ...mockCheckpoint,
        id: 'child-checkpoint-789',
      };
      // Put with existing checkpoint_id as parent
      const configWithParent = {
        configurable: {
          thread_id: 'test-thread-123',
          checkpoint_id: 'checkpoint-456', // This becomes the parent
        },
      };

      await checkpointer.put(configWithParent, childCheckpoint, mockMetadata);

      // Retrieve child checkpoint
      const tuple = await checkpointer.getTuple({
        configurable: { thread_id: 'test-thread-123' },
      });

      expect(tuple?.checkpoint.id).toBe('child-checkpoint-789');
      expect(tuple?.parentConfig?.configurable?.checkpoint_id).toBe('checkpoint-456');
      expect(tuple?.parentConfig?.configurable?.thread_id).toBe('test-thread-123');
    });

    it('should return undefined for non-existent thread', async () => {
      const tuple = await checkpointer.getTuple({
        configurable: { thread_id: 'non-existent-thread' },
      });

      expect(tuple).toBeUndefined();
    });

    it('should throw error when thread_id is missing in put()', async () => {
      const invalidConfig = { configurable: {} };

      await expect(checkpointer.put(invalidConfig, mockCheckpoint, mockMetadata)).rejects.toThrow(
        'thread_id not found in config'
      );
    });

    it('should throw error when thread_id is missing in getTuple()', async () => {
      const invalidConfig = { configurable: {} };

      await expect(checkpointer.getTuple(invalidConfig)).rejects.toThrow(
        'thread_id not found in config'
      );
    });
  });

  describe('putWrites() and pending writes', () => {
    it('should store and retrieve pending writes', async () => {
      // First store a checkpoint
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      // Store pending writes
      const writes: PendingWrite[] = [
        ['messages', { role: 'assistant', content: 'Hello back!' }],
        ['status', 'processing'],
      ];
      await checkpointer.putWrites(mockConfig, writes, 'task-123');

      // Retrieve checkpoint with pending writes
      const tuple = await checkpointer.getTuple(mockConfig);

      expect(tuple?.pendingWrites).toBeDefined();
      expect(tuple?.pendingWrites?.length).toBe(2);

      const [taskId1, channel1, value1] = tuple!.pendingWrites![0];
      expect(taskId1).toBe('task-123');
      expect(channel1).toBe('messages');
      expect(value1).toEqual({ role: 'assistant', content: 'Hello back!' });

      const [taskId2, channel2, value2] = tuple!.pendingWrites![1];
      expect(taskId2).toBe('task-123');
      expect(channel2).toBe('status');
      expect(value2).toBe('processing');
    });

    it('should accumulate multiple write operations', async () => {
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      // Store first batch of writes
      const writes1: PendingWrite[] = [['messages', { role: 'user', content: 'First' }]];
      await checkpointer.putWrites(mockConfig, writes1, 'task-1');

      // Store second batch of writes
      const writes2: PendingWrite[] = [['messages', { role: 'assistant', content: 'Second' }]];
      await checkpointer.putWrites(mockConfig, writes2, 'task-2');

      // Should have both writes
      const tuple = await checkpointer.getTuple(mockConfig);
      expect(tuple?.pendingWrites?.length).toBe(2);
    });

    it('should throw error when config is invalid for putWrites()', async () => {
      const invalidConfig = { configurable: {} };
      const writes: PendingWrite[] = [['test', 'value']];

      await expect(checkpointer.putWrites(invalidConfig, writes, 'task-123')).rejects.toThrow(
        'Invalid config, missing thread_id or checkpoint_id'
      );
    });
  });

  describe('list()', () => {
    beforeEach(async () => {
      // Setup multiple checkpoints for testing
      const checkpoints = [
        { id: 'checkpoint-1', step: 1, ts: '2025-01-01T00:00:00.000Z' },
        { id: 'checkpoint-2', step: 2, ts: '2025-01-01T01:00:00.000Z' },
        { id: 'checkpoint-3', step: 3, ts: '2025-01-01T02:00:00.000Z' },
      ];

      for (const checkpointData of checkpoints) {
        const config = {
          configurable: {
            thread_id: 'test-thread-123',
            checkpoint_id: checkpointData.id,
          },
        };
        const checkpoint = { ...mockCheckpoint, ...checkpointData };
        const metadata = { ...mockMetadata, step: checkpointData.step };

        await checkpointer.put(config, checkpoint, metadata);
      }
    });

    it('should list all checkpoints for a thread', async () => {
      const checkpoints: CheckpointTuple[] = [];
      for await (const tuple of checkpointer.list(mockConfig)) {
        checkpoints.push(tuple);
      }

      expect(checkpoints.length).toBe(3);
      // Should be in order with latest first (checkpoint-3, checkpoint-2, checkpoint-1)
      expect(checkpoints[0].checkpoint.id).toBe('checkpoint-3');
      expect(checkpoints[1].checkpoint.id).toBe('checkpoint-2');
      expect(checkpoints[2].checkpoint.id).toBe('checkpoint-1');
    });

    it('should respect limit option', async () => {
      const options: CheckpointListOptions = { limit: 2 };
      const checkpoints: CheckpointTuple[] = [];
      for await (const tuple of checkpointer.list(mockConfig, options)) {
        checkpoints.push(tuple);
      }

      expect(checkpoints.length).toBe(2);
      expect(checkpoints[0].checkpoint.id).toBe('checkpoint-3');
      expect(checkpoints[1].checkpoint.id).toBe('checkpoint-2');
    });

    it('should filter by metadata', async () => {
      const options: CheckpointListOptions = {
        filter: { step: 2 },
      };
      const checkpoints: CheckpointTuple[] = [];
      for await (const tuple of checkpointer.list(mockConfig, options)) {
        checkpoints.push(tuple);
      }

      expect(checkpoints.length).toBe(1);
      expect(checkpoints[0].checkpoint.id).toBe('checkpoint-2');
      expect(checkpoints[0].metadata?.step).toBe(2);
    });

    it('should return empty for non-existent thread', async () => {
      const nonExistentConfig = {
        configurable: { thread_id: 'non-existent' },
      };
      const checkpoints: CheckpointTuple[] = [];
      for await (const tuple of checkpointer.list(nonExistentConfig)) {
        checkpoints.push(tuple);
      }

      expect(checkpoints.length).toBe(0);
    });

    it('should handle missing thread_id gracefully', async () => {
      const invalidConfig = { configurable: {} };
      const checkpoints: CheckpointTuple[] = [];
      for await (const tuple of checkpointer.list(invalidConfig)) {
        checkpoints.push(tuple);
      }

      expect(checkpoints.length).toBe(0);
    });
  });

  describe('deleteThread()', () => {
    it('should delete all data for a thread', async () => {
      // Store checkpoint and writes
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);
      const writes: PendingWrite[] = [['test', 'value']];
      await checkpointer.putWrites(mockConfig, writes, 'task-123');

      // Verify data exists
      let tuple = await checkpointer.getTuple(mockConfig);
      expect(tuple).toBeDefined();

      // Delete thread
      await checkpointer.deleteThread('test-thread-123');

      // Verify data is gone
      tuple = await checkpointer.getTuple(mockConfig);
      expect(tuple).toBeUndefined();
    });

    it('should not affect other threads', async () => {
      // Store data for two different threads
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      const otherConfig = {
        configurable: {
          thread_id: 'other-thread',
          checkpoint_id: 'other-checkpoint',
        },
      };
      const otherCheckpoint = { ...mockCheckpoint, id: 'other-checkpoint' };
      await checkpointer.put(otherConfig, otherCheckpoint, mockMetadata);

      // Delete one thread
      await checkpointer.deleteThread('test-thread-123');

      // First thread should be gone
      const tuple1 = await checkpointer.getTuple(mockConfig);
      expect(tuple1).toBeUndefined();

      // Other thread should remain
      const tuple2 = await checkpointer.getTuple(otherConfig);
      expect(tuple2).toBeDefined();
      expect(tuple2?.checkpoint.id).toBe('other-checkpoint');
    });
  });

  describe('exportState() and importState()', () => {
    it('should export and import state correctly', async () => {
      // Store some data
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);
      const writes: PendingWrite[] = [['test', 'value']];
      await checkpointer.putWrites(mockConfig, writes, 'task-123');

      // Export state
      const exportedState = await checkpointer.exportState();
      expect(exportedState).toBeDefined();
      expect(typeof exportedState).toBe('string');

      // Create new checkpointer and import state
      const newCheckpointer = new JsonCheckpointSaver();
      await newCheckpointer.importState(exportedState);

      // Verify data was imported correctly
      const tuple = await newCheckpointer.getTuple(mockConfig);
      expect(tuple).toBeDefined();
      expect(tuple?.checkpoint.id).toBe(mockCheckpoint.id);
      expect(tuple?.pendingWrites?.length).toBe(1);
    });

    it('should handle empty state export/import', async () => {
      const exportedState = await checkpointer.exportState();

      const newCheckpointer = new JsonCheckpointSaver();
      await newCheckpointer.importState(exportedState);

      const tuple = await newCheckpointer.getTuple(mockConfig);
      expect(tuple).toBeUndefined();
    });

    it('should handle legacy state without version', async () => {
      const legacyState = JSON.stringify({
        storage: {},
        writes: {},
      });

      const newCheckpointer = new JsonCheckpointSaver();
      await newCheckpointer.importState(legacyState);

      // Should not throw and should work normally
      const tuple = await newCheckpointer.getTuple(mockConfig);
      expect(tuple).toBeUndefined();
    });

    it('should handle invalid JSON in importState()', async () => {
      await expect(checkpointer.importState('invalid json')).rejects.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle complex nested data structures', async () => {
      const complexCheckpoint = {
        ...mockCheckpoint,
        channel_values: {
          nested: {
            deeply: {
              nested: {
                array: [1, 2, { complex: 'object' }],
                nullValue: null,
                undefinedValue: undefined,
              },
            },
          },
        },
      };

      await checkpointer.put(mockConfig, complexCheckpoint, mockMetadata);
      const tuple = await checkpointer.getTuple(mockConfig);

      expect(tuple?.checkpoint.channel_values).toEqual(complexCheckpoint.channel_values);
    });

    it('should handle unicode and special characters', async () => {
      const unicodeCheckpoint = {
        ...mockCheckpoint,
        channel_values: {
          unicode: '🚀 Unicode test with émojis and spéciäl chärs',
          chinese: '中文测试',
          emoji: '🎉🔥💯',
        },
      };

      await checkpointer.put(mockConfig, unicodeCheckpoint, mockMetadata);
      const tuple = await checkpointer.getTuple(mockConfig);

      expect(tuple?.checkpoint.channel_values).toEqual(unicodeCheckpoint.channel_values);
    });

    it('should handle large data volumes', async () => {
      const largeData = Array(1000)
        .fill(0)
        .map((_, i) => ({
          id: i,
          data: `Large data chunk ${i}`.repeat(100),
        }));

      const largeCheckpoint = {
        ...mockCheckpoint,
        channel_values: { largeData },
      };

      await checkpointer.put(mockConfig, largeCheckpoint, mockMetadata);
      const tuple = await checkpointer.getTuple(mockConfig);

      expect(tuple?.checkpoint.channel_values.largeData).toEqual(largeData);
    });
  });
});
