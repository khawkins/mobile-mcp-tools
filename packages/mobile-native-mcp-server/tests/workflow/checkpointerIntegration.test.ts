/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RunnableConfig } from '@langchain/core/runnables';
import { Checkpoint, CheckpointMetadata, CheckpointTuple } from '@langchain/langgraph';
import { PendingWrite } from '@langchain/langgraph-checkpoint';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { JsonCheckpointSaver } from '../../src/workflow/jsonCheckpointer.js';
import { WorkflowStatePersistence } from '../../src/workflow/workflowStatePersistence.js';

describe('JsonCheckpointSaver + WorkflowStatePersistence Integration', () => {
  let tempDir: string;
  let stateFilePath: string;
  let checkpointer: JsonCheckpointSaver;
  let persistence: WorkflowStatePersistence;

  // Mock data fixtures
  let mockConfig: RunnableConfig;
  let mockCheckpoint: Checkpoint;
  let mockMetadata: CheckpointMetadata;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'integration-test-'));
    stateFilePath = path.join(tempDir, 'integration-state.json');

    checkpointer = new JsonCheckpointSaver();
    persistence = new WorkflowStatePersistence(stateFilePath);

    // Setup mock data
    mockConfig = {
      configurable: {
        thread_id: 'integration-thread-123',
        checkpoint_id: 'checkpoint-456',
      },
    };

    mockCheckpoint = {
      id: 'checkpoint-456',
      ts: '2025-01-01T00:00:00.000Z',
      v: 1,
      channel_values: {
        messages: [{ role: 'user', content: 'Integration test message' }],
        userInput: 'Create a mobile app',
        currentStep: 'userInputTriage',
      },
      channel_versions: {
        messages: 1,
        userInput: 1,
        currentStep: 1,
      },
      versions_seen: {
        userInputTriage: { messages: 1 },
      },
    };

    mockMetadata = {
      source: 'input',
      step: 1,
      parents: {},
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Round-trip Persistence', () => {
    it('should persist and restore complete checkpointer state', async () => {
      // Store data in checkpointer
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      const writes: PendingWrite[] = [
        ['messages', { role: 'assistant', content: 'Processing your request...' }],
        ['status', 'in_progress'],
        ['stepData', { currentNode: 'userInputTriage', nextNode: 'templateDiscovery' }],
      ];
      await checkpointer.putWrites(mockConfig, writes, 'integration-task-1');

      // Export and persist state
      const exportedState = await checkpointer.exportState();
      await persistence.writeState(exportedState);

      // Verify file was created
      const stateExists = await persistence.stateExists();
      expect(stateExists).toBe(true);

      // Create new checkpointer and restore state
      const newCheckpointer = new JsonCheckpointSaver();
      const restoredState = await persistence.readState();
      expect(restoredState).toBeDefined();

      await newCheckpointer.importState(restoredState!);

      // Verify data was restored correctly
      const tuple = await newCheckpointer.getTuple(mockConfig);
      expect(tuple).toBeDefined();
      expect(tuple!.checkpoint.id).toBe(mockCheckpoint.id);
      expect(tuple!.checkpoint.channel_values).toEqual(mockCheckpoint.channel_values);
      expect(tuple!.metadata).toEqual(mockMetadata);
      expect(tuple!.pendingWrites?.length).toBe(3);

      // Verify pending writes
      const [taskId, channel, value] = tuple!.pendingWrites![0];
      expect(taskId).toBe('integration-task-1');
      expect(channel).toBe('messages');
      expect(value).toEqual({ role: 'assistant', content: 'Processing your request...' });
    });

    it('should handle multiple threads and checkpoints', async () => {
      // Setup multiple threads with multiple checkpoints each
      const threads = [
        { id: 'thread-1', checkpoints: ['cp-1-1', 'cp-1-2', 'cp-1-3'] },
        { id: 'thread-2', checkpoints: ['cp-2-1', 'cp-2-2'] },
        { id: 'thread-3', checkpoints: ['cp-3-1'] },
      ];

      // Store all data
      for (const thread of threads) {
        for (const [index, checkpointId] of thread.checkpoints.entries()) {
          const config = {
            configurable: {
              thread_id: thread.id,
              checkpoint_id: checkpointId,
            },
          };

          const checkpoint = {
            ...mockCheckpoint,
            id: checkpointId,
            ts: new Date(Date.now() + index * 1000).toISOString(),
            channel_values: {
              ...mockCheckpoint.channel_values,
              threadId: thread.id,
              stepNumber: index + 1,
            },
          };

          const metadata = {
            ...mockMetadata,
            step: index + 1,
            threadId: thread.id,
          };

          await checkpointer.put(config, checkpoint, metadata);

          // Add some writes for each checkpoint
          const writes: PendingWrite[] = [
            ['progress', `Step ${index + 1} for ${thread.id}`],
            ['threadInfo', { threadId: thread.id, checkpointId }],
          ];
          await checkpointer.putWrites(config, writes, `task-${thread.id}-${index}`);
        }
      }

      // Persist and restore
      const exportedState = await checkpointer.exportState();
      await persistence.writeState(exportedState);

      const newCheckpointer = new JsonCheckpointSaver();
      const restoredState = await persistence.readState();
      await newCheckpointer.importState(restoredState!);

      // Verify all threads and checkpoints were restored
      for (const thread of threads) {
        const threadConfig = { configurable: { thread_id: thread.id } };

        // Get latest checkpoint for thread
        const tuple = await newCheckpointer.getTuple(threadConfig);
        expect(tuple).toBeDefined();

        // Should be the last checkpoint for this thread
        const lastCheckpointId = thread.checkpoints[thread.checkpoints.length - 1];
        expect(tuple!.checkpoint.id).toBe(lastCheckpointId);
        expect(tuple!.checkpoint.channel_values.threadId).toBe(thread.id);

        // List all checkpoints for thread
        const allCheckpoints: CheckpointTuple[] = [];
        for await (const checkpointTuple of newCheckpointer.list(threadConfig)) {
          allCheckpoints.push(checkpointTuple);
        }

        expect(allCheckpoints.length).toBe(thread.checkpoints.length);
      }
    });

    it('should preserve data integrity across multiple persist/restore cycles', async () => {
      // Initial data
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);
      const writes: PendingWrite[] = [['initial', 'data']];
      await checkpointer.putWrites(mockConfig, writes, 'cycle-1');

      for (let cycle = 1; cycle <= 5; cycle++) {
        // Export and persist
        const exportedState = await checkpointer.exportState();
        await persistence.writeState(exportedState);

        // Create new checkpointer and restore
        const newCheckpointer = new JsonCheckpointSaver();
        const restoredState = await persistence.readState();
        await newCheckpointer.importState(restoredState!);

        // Add more data
        const newCheckpoint = {
          ...mockCheckpoint,
          id: `checkpoint-${cycle + 1}`,
          ts: new Date(Date.now() + cycle * 1000).toISOString(),
          channel_values: {
            ...mockCheckpoint.channel_values,
            cycle: cycle,
          },
        };

        const newConfig = {
          ...mockConfig,
          configurable: {
            ...mockConfig.configurable,
            checkpoint_id: `checkpoint-${cycle + 1}`,
          },
        };

        await newCheckpointer.put(newConfig, newCheckpoint, {
          ...mockMetadata,
          step: cycle + 1,
        });

        const cycleWrites: PendingWrite[] = [
          ['cycle', cycle],
          ['timestamp', new Date().toISOString()],
        ];
        await newCheckpointer.putWrites(newConfig, cycleWrites, `cycle-${cycle + 1}`);

        // Use the new checkpointer for next iteration
        checkpointer = newCheckpointer;
      }

      // Final verification
      const finalTuple = await checkpointer.getTuple({
        configurable: { thread_id: 'integration-thread-123' },
      });

      expect(finalTuple).toBeDefined();
      expect(finalTuple!.checkpoint.id).toBe('checkpoint-6');
      expect(finalTuple!.checkpoint.channel_values.cycle).toBe(5);

      // Check all checkpoints exist
      const allCheckpoints: CheckpointTuple[] = [];
      for await (const tuple of checkpointer.list({
        configurable: { thread_id: 'integration-thread-123' },
      })) {
        allCheckpoints.push(tuple);
      }

      expect(allCheckpoints.length).toBe(6); // Original + 5 cycles
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle corrupted persistence file gracefully', async () => {
      // Store valid data
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      // Write corrupted data to file
      await fs.writeFile(stateFilePath, 'corrupted json data', 'utf-8');

      // Try to restore - should return undefined for corrupted data
      const corruptedState = await persistence.readState();
      expect(corruptedState).toBeUndefined();

      // Should be able to start fresh
      const newCheckpointer = new JsonCheckpointSaver();
      await newCheckpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      const exportedState = await newCheckpointer.exportState();
      await persistence.writeState(exportedState);

      // Should work normally now
      const restoredState = await persistence.readState();
      expect(restoredState).toBeDefined();
    });

    it('should handle missing persistence file gracefully', async () => {
      // Ensure file doesn't exist
      try {
        await fs.unlink(stateFilePath);
      } catch {
        // File already doesn't exist
      }

      // Try to read - should return undefined
      const missingState = await persistence.readState();
      expect(missingState).toBeUndefined();

      // Should be able to create new state
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      const exportedState = await checkpointer.exportState();
      await persistence.writeState(exportedState);

      // Should work normally
      const newState = await persistence.readState();
      expect(newState).toBeDefined();
    });

    it('should handle large state objects', async () => {
      // Create large checkpoint data
      const largeData = Array(1000)
        .fill(0)
        .map((_, i) => ({
          id: i,
          data: 'Large data chunk '.repeat(100),
          nested: {
            moreData: Array(50)
              .fill(0)
              .map((_, j) => `Item ${i}-${j}`),
          },
        }));

      const largeCheckpoint = {
        ...mockCheckpoint,
        channel_values: {
          ...mockCheckpoint.channel_values,
          largeData,
          metadata: {
            size: largeData.length,
            totalSize: JSON.stringify(largeData).length,
          },
        },
      };

      // Store large data
      await checkpointer.put(mockConfig, largeCheckpoint, mockMetadata);

      // Add large writes
      const largeWrites: PendingWrite[] = Array(100)
        .fill(0)
        .map((_, i) => [
          `channel-${i}`,
          {
            id: i,
            data: 'Large write data '.repeat(50),
            timestamp: new Date().toISOString(),
          },
        ]);
      await checkpointer.putWrites(mockConfig, largeWrites, 'large-task');

      // Export and persist
      const exportedState = await checkpointer.exportState();
      await persistence.writeState(exportedState);

      // Verify file size is substantial
      const stats = await fs.stat(stateFilePath);
      expect(stats.size).toBeGreaterThan(100000); // Should be substantial

      // Restore and verify
      const newCheckpointer = new JsonCheckpointSaver();
      const restoredState = await persistence.readState();
      await newCheckpointer.importState(restoredState!);

      const tuple = await newCheckpointer.getTuple(mockConfig);
      expect(tuple).toBeDefined();
      expect(tuple!.checkpoint.channel_values.largeData).toEqual(largeData);
      expect(tuple!.pendingWrites?.length).toBe(100);
    });

    it('should handle concurrent access gracefully', async () => {
      // Store initial data
      await checkpointer.put(mockConfig, mockCheckpoint, mockMetadata);

      // Simulate concurrent export/persist operations
      const exportPromises = Array(5)
        .fill(0)
        .map(async (_, i) => {
          const tempCheckpointer = new JsonCheckpointSaver();
          await tempCheckpointer.importState(await checkpointer.exportState());

          // Add unique data to each
          const uniqueCheckpoint = {
            ...mockCheckpoint,
            id: `concurrent-${i}`,
            channel_values: {
              ...mockCheckpoint.channel_values,
              concurrentId: i,
              timestamp: Date.now(),
            },
          };

          const uniqueConfig = {
            ...mockConfig,
            configurable: {
              ...mockConfig.configurable,
              checkpoint_id: `concurrent-${i}`,
            },
          };

          await tempCheckpointer.put(uniqueConfig, uniqueCheckpoint, mockMetadata);

          return tempCheckpointer.exportState();
        });

      const allExportedStates = await Promise.all(exportPromises);

      // Persist all states concurrently
      const persistPromises = allExportedStates.map(async (state, i) => {
        const concurrentPersistence = new WorkflowStatePersistence(
          path.join(tempDir, `concurrent-${i}.json`)
        );
        return concurrentPersistence.writeState(state);
      });

      // All should succeed
      await expect(Promise.all(persistPromises)).resolves.not.toThrow();

      // Verify all files were created
      for (let i = 0; i < 5; i++) {
        const filePath = path.join(tempDir, `concurrent-${i}.json`);
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('Real-world Workflow Simulation', () => {
    it('should simulate a complete mobile app generation workflow', async () => {
      // Simulate workflow steps
      const workflowSteps = [
        {
          node: 'userInputTriage',
          userInput: 'Create an iOS app for tracking expenses',
          result: { platform: 'iOS', appType: 'expense-tracker' },
        },
        {
          node: 'templateDiscovery',
          input: { platform: 'iOS', appType: 'expense-tracker' },
          result: { template: 'iOSNativeSwiftTemplate', features: ['core-data', 'charts'] },
        },
        {
          node: 'projectGeneration',
          input: { template: 'iOSNativeSwiftTemplate', features: ['core-data', 'charts'] },
          result: { projectPath: '/tmp/ExpenseTracker', files: ['project.pbxproj', 'main.swift'] },
        },
        {
          node: 'buildConfiguration',
          input: { projectPath: '/tmp/ExpenseTracker' },
          result: { buildSettings: { target: 'iOS 17.0' }, configured: true },
        },
      ];

      const currentThreadId = 'workflow-simulation-123';

      for (const [index, step] of workflowSteps.entries()) {
        const config = {
          configurable: {
            thread_id: currentThreadId,
            checkpoint_id: `step-${index + 1}`,
          },
        };

        const checkpoint = {
          id: `step-${index + 1}`,
          ts: new Date(Date.now() + index * 1000).toISOString(),
          v: 1,
          channel_values: {
            currentNode: step.node,
            userInput: step.userInput || step.input,
            stepResult: step.result,
            completedSteps: workflowSteps.slice(0, index + 1).map(s => s.node),
            progress: ((index + 1) / workflowSteps.length) * 100,
          },
          channel_versions: {
            currentNode: index + 1,
            userInput: 1,
            stepResult: index + 1,
          },
          versions_seen: {
            [step.node]: { currentNode: index + 1 },
          },
        };

        const metadata = {
          source: 'input' as const,
          step: index + 1,
          parents: {},
        };

        await checkpointer.put(config, checkpoint, metadata);

        // Add step-specific writes
        const writes: PendingWrite[] = [
          ['stepProgress', { current: index + 1, total: workflowSteps.length }],
          ['stepResult', step.result],
          ['nextAction', index < workflowSteps.length - 1 ? 'continue' : 'complete'],
        ];
        await checkpointer.putWrites(config, writes, `step-${index + 1}-task`);

        // Persist state after each step
        const exportedState = await checkpointer.exportState();
        await persistence.writeState(exportedState);
      }

      // Simulate workflow interruption and resumption
      const newCheckpointer = new JsonCheckpointSaver();
      const restoredState = await persistence.readState();
      await newCheckpointer.importState(restoredState!);

      // Verify final state
      const finalTuple = await newCheckpointer.getTuple({
        configurable: { thread_id: currentThreadId },
      });

      expect(finalTuple).toBeDefined();
      expect(finalTuple!.checkpoint.id).toBe('step-4');
      expect(finalTuple!.checkpoint.channel_values.currentNode).toBe('buildConfiguration');
      expect(finalTuple!.checkpoint.channel_values.progress).toBe(100);
      expect(finalTuple!.checkpoint.channel_values.completedSteps).toEqual([
        'userInputTriage',
        'templateDiscovery',
        'projectGeneration',
        'buildConfiguration',
      ]);

      // Verify all steps can be listed
      const allSteps: CheckpointTuple[] = [];
      for await (const tuple of newCheckpointer.list({
        configurable: { thread_id: currentThreadId },
      })) {
        allSteps.push(tuple);
      }

      expect(allSteps.length).toBe(4);
      expect(allSteps[0].checkpoint.channel_values.currentNode).toBe('buildConfiguration');
      expect(allSteps[3].checkpoint.channel_values.currentNode).toBe('userInputTriage');

      // Verify pending writes for final step
      expect(finalTuple!.pendingWrites?.length).toBe(3);
      const nextActionWrite = finalTuple!.pendingWrites?.find(
        ([, channel]) => channel === 'nextAction'
      );
      expect(nextActionWrite).toBeDefined();
      expect(nextActionWrite![2]).toBe('complete');
    });
  });
});
