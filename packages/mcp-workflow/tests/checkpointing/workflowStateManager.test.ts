/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemorySaver } from '@langchain/langgraph';
import { WorkflowStateManager } from '../../src/checkpointing/workflowStateManager.js';
import { JsonCheckpointSaver } from '../../src/checkpointing/jsonCheckpointer.js';
import { WellKnownDirectoryManager } from '../../src/storage/wellKnownDirectory.js';
import { MockFileSystem } from '../utils/MockFileSystem.js';
import path from 'path';

describe('WorkflowStateManager', () => {
  let mockFs: MockFileSystem;
  let wellKnownDirManager: WellKnownDirectoryManager;
  const testProjectPath = '/test/project';

  beforeEach(() => {
    // Create mock filesystem for testing
    mockFs = new MockFileSystem();

    // Create WellKnownDirectoryManager with mock filesystem
    wellKnownDirManager = new WellKnownDirectoryManager({
      projectPath: testProjectPath,
      fileSystemOperations: mockFs,
    });
  });

  describe('constructor', () => {
    it('should create manager with default production environment', () => {
      const manager = new WorkflowStateManager({
        fileSystemOperations: mockFs,
      });
      expect(manager).toBeDefined();
    });

    it('should create manager with test environment', () => {
      const manager = new WorkflowStateManager({
        environment: 'test',
        fileSystemOperations: mockFs,
      });
      expect(manager).toBeDefined();
    });

    it('should accept custom project path', () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });
      expect(manager).toBeDefined();
    });
  });

  describe('createCheckpointer()', () => {
    it('should create MemorySaver for test environment', async () => {
      const manager = new WorkflowStateManager({
        environment: 'test',
        fileSystemOperations: mockFs,
      });

      const checkpointer = await manager.createCheckpointer();

      expect(checkpointer).toBeInstanceOf(MemorySaver);
    });

    it('should create JsonCheckpointSaver for production environment', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      const checkpointer = await manager.createCheckpointer();

      expect(checkpointer).toBeInstanceOf(JsonCheckpointSaver);
    });

    it('should default to production environment when not specified', async () => {
      const manager = new WorkflowStateManager({
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      const checkpointer = await manager.createCheckpointer();

      expect(checkpointer).toBeInstanceOf(JsonCheckpointSaver);
    });

    it('should load existing state when creating JsonCheckpointSaver', async () => {
      const existingState = {
        storage: {
          'test-thread': [
            {
              checkpoint: 'base64-checkpoint-data',
              metadata: 'base64-metadata',
            },
          ],
        },
        writes: {},
      };

      // Use WellKnownDirectoryManager to get the correct path
      const stateFilePath = wellKnownDirManager.getWorkflowStateStorePath();
      await mockFs.writeFile(stateFilePath, JSON.stringify(existingState), 'utf-8');

      // Create manager with same config
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });
      const checkpointer = (await manager.createCheckpointer()) as JsonCheckpointSaver;

      // Verify state was loaded
      const exportedState = await checkpointer.exportState();
      const parsedState = JSON.parse(exportedState);

      expect(parsedState.storage).toEqual(existingState.storage);
    });

    it('should create fresh JsonCheckpointSaver when no state exists', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      const checkpointer = (await manager.createCheckpointer()) as JsonCheckpointSaver;

      // Verify it's a fresh checkpointer
      const exportedState = await checkpointer.exportState();
      const parsedState = JSON.parse(exportedState);

      expect(parsedState.storage).toEqual({});
      expect(parsedState.writes).toEqual({});
    });
  });

  describe('saveCheckpointerState()', () => {
    it('should save JsonCheckpointSaver state to disk in production', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });
      const checkpointer = (await manager.createCheckpointer()) as JsonCheckpointSaver;

      await manager.saveCheckpointerState(checkpointer);

      // Verify state file was created using WellKnownDirectoryManager
      const stateFilePath = wellKnownDirManager.getWorkflowStateStorePath();
      expect(mockFs.hasFile(stateFilePath)).toBe(true);
    });

    it('should not save state for MemorySaver in test environment', async () => {
      const manager = new WorkflowStateManager({
        environment: 'test',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });
      const checkpointer = await manager.createCheckpointer();

      await manager.saveCheckpointerState(checkpointer);

      // Verify no state file was created
      const stateFilePath = wellKnownDirManager.getWorkflowStateStorePath();
      expect(mockFs.hasFile(stateFilePath)).toBe(false);
    });

    it('should throw error if test environment has JsonCheckpointSaver (sanity check)', async () => {
      const manager = new WorkflowStateManager({
        environment: 'test',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      // Manually create a JsonCheckpointSaver (simulating invalid state)
      const invalidCheckpointer = new JsonCheckpointSaver();

      // Should throw error due to sanity check
      await expect(manager.saveCheckpointerState(invalidCheckpointer)).rejects.toThrow(
        'Invalid state: test environment should use MemorySaver, not JsonCheckpointSaver'
      );
    });

    it('should handle saving when state directory does not exist', async () => {
      // MockFileSystem automatically creates directories, so this tests mkdir with recursive
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });
      const checkpointer = await manager.createCheckpointer();

      // Should create directory and save state
      await manager.saveCheckpointerState(checkpointer);

      // Verify state file was created
      const stateFilePath = wellKnownDirManager.getWorkflowStateStorePath();
      expect(mockFs.hasFile(stateFilePath)).toBe(true);
    });
  });

  describe('clearState()', () => {
    it('should delete existing state file', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      // Create and save a checkpointer
      const checkpointer = await manager.createCheckpointer();
      await manager.saveCheckpointerState(checkpointer);

      // Verify state exists
      const exists = await manager.stateExists();
      expect(exists).toBe(true);

      // Clear state
      await manager.clearState();

      // Verify state is gone
      const existsAfter = await manager.stateExists();
      expect(existsAfter).toBe(false);
    });

    it('should handle clearing non-existent state gracefully', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      // Should not throw when clearing non-existent state
      await expect(manager.clearState()).resolves.not.toThrow();
    });
  });

  describe('stateExists()', () => {
    it('should return true when state file exists', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      // Create and save state
      const checkpointer = await manager.createCheckpointer();
      await manager.saveCheckpointerState(checkpointer);

      const exists = await manager.stateExists();
      expect(exists).toBe(true);
    });

    it('should return false when state file does not exist', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      const exists = await manager.stateExists();
      expect(exists).toBe(false);
    });
  });

  describe('Integration: Full workflow lifecycle', () => {
    it('should support full create -> save -> load -> clear cycle', async () => {
      const config = {
        environment: 'production' as const,
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      };

      const manager = new WorkflowStateManager(config);

      // 1. Create fresh checkpointer
      const checkpointer1 = await manager.createCheckpointer();
      expect(checkpointer1).toBeInstanceOf(JsonCheckpointSaver);

      // 2. Save state
      await manager.saveCheckpointerState(checkpointer1);

      // 3. Verify state exists
      const exists = await manager.stateExists();
      expect(exists).toBe(true);

      // 4. Create new manager instance and load state (same mockFs!)
      const manager2 = new WorkflowStateManager(config);
      const checkpointer2 = await manager2.createCheckpointer();
      expect(checkpointer2).toBeInstanceOf(JsonCheckpointSaver);

      // 5. Clear state
      await manager2.clearState();

      // 6. Verify state is gone
      const existsAfter = await manager2.stateExists();
      expect(existsAfter).toBe(false);
    });

    it('should isolate test environment from production state', async () => {
      const sharedConfig = {
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      };

      // Create and save production state
      const productionManager = new WorkflowStateManager({
        ...sharedConfig,
        environment: 'production',
      });
      const prodCheckpointer = await productionManager.createCheckpointer();
      await productionManager.saveCheckpointerState(prodCheckpointer);

      // Verify production state exists
      const prodExists = await productionManager.stateExists();
      expect(prodExists).toBe(true);

      // Create test manager
      const testManager = new WorkflowStateManager({
        ...sharedConfig,
        environment: 'test',
      });
      const testCheckpointer = await testManager.createCheckpointer();

      // Test checkpointer should be MemorySaver
      expect(testCheckpointer).toBeInstanceOf(MemorySaver);

      // Saving test checkpointer should not affect production state
      await testManager.saveCheckpointerState(testCheckpointer);

      // Production state should still exist
      const prodExistsAfter = await productionManager.stateExists();
      expect(prodExistsAfter).toBe(true);
    });

    it('should handle custom project paths correctly', async () => {
      const customProjectPath = path.resolve('/custom/project');
      const customMockFs = new MockFileSystem();

      const customWellKnownDirManager = new WellKnownDirectoryManager({
        projectPath: customProjectPath,
        fileSystemOperations: customMockFs,
      });

      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: customProjectPath,
        fileSystemOperations: customMockFs,
      });

      const checkpointer = await manager.createCheckpointer();
      await manager.saveCheckpointerState(checkpointer);

      // Verify state was saved in custom location using WellKnownDirectoryManager
      const customStatePath = customWellKnownDirManager.getWorkflowStateStorePath();
      expect(customMockFs.hasFile(customStatePath)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted state file gracefully', async () => {
      // Create corrupted state file using WellKnownDirectoryManager
      const stateFilePath = wellKnownDirManager.getWorkflowStateStorePath();
      await mockFs.writeFile(stateFilePath, 'invalid json content', 'utf-8');

      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });

      // Should create fresh checkpointer despite corrupted file
      const checkpointer = await manager.createCheckpointer();
      expect(checkpointer).toBeInstanceOf(JsonCheckpointSaver);

      // State should be fresh (empty)
      const exportedState = await (checkpointer as JsonCheckpointSaver).exportState();
      const parsedState = JSON.parse(exportedState);
      expect(parsedState.storage).toEqual({});
    });

    it('should handle file system permission errors during save', async () => {
      // Create a mock filesystem that throws permission errors
      const errorMockFs = new MockFileSystem();
      // Override mkdir to throw a permission error
      errorMockFs.mkdir = async () => {
        const error: NodeJS.ErrnoException = new Error('EACCES: permission denied');
        error.code = 'EACCES';
        throw error;
      };

      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: errorMockFs,
      });
      const checkpointer = await manager.createCheckpointer();

      await expect(manager.saveCheckpointerState(checkpointer)).rejects.toThrow();
    });

    it('should throw error when trying to save invalid JSON state', async () => {
      const manager = new WorkflowStateManager({
        environment: 'production',
        projectPath: testProjectPath,
        fileSystemOperations: mockFs,
      });
      const checkpointer = (await manager.createCheckpointer()) as JsonCheckpointSaver;

      // Mock exportState to return invalid JSON (not actually parseable)
      const originalExportState = checkpointer.exportState.bind(checkpointer);
      checkpointer.exportState = async () => {
        // Return a string that's not valid JSON
        return 'this is not valid JSON{]';
      };

      // Should throw error due to invalid JSON
      await expect(manager.saveCheckpointerState(checkpointer)).rejects.toThrow(
        'Invalid serialized state'
      );

      // Restore original method
      checkpointer.exportState = originalExportState;
    });
  });
});
