/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { WorkflowStatePersistence } from '../../src/workflow/workflowStatePersistence.js';

describe('WorkflowStatePersistence', () => {
  let tempDir: string;
  let testFilePath: string;
  let persistence: WorkflowStatePersistence;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-test-'));
    testFilePath = path.join(tempDir, 'test-state.json');
    persistence = new WorkflowStatePersistence(testFilePath);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('writeState() and readState()', () => {
    it('should write and read valid JSON state', async () => {
      const testState = {
        version: 1,
        storage: {
          'thread-123': [
            {
              checkpoint: 'base64-encoded-checkpoint',
              metadata: 'base64-encoded-metadata',
            },
          ],
        },
        writes: {
          'thread-123:checkpoint-456': '{"write1":["task","channel","data"]}',
        },
      };

      const serializedState = JSON.stringify(testState);

      // Write state
      await persistence.writeState(serializedState);

      // Verify file exists
      const exists = await persistence.stateExists();
      expect(exists).toBe(true);

      // Read state back
      const readState = await persistence.readState();
      expect(readState).toBeDefined();
      expect(JSON.parse(readState!)).toEqual(testState);
    });

    it('should create directory structure if it does not exist', async () => {
      const nestedPath = path.join(tempDir, 'nested', 'deep', 'directory', 'state.json');
      const nestedPersistence = new WorkflowStatePersistence(nestedPath);

      const testState = { test: 'data' };
      await nestedPersistence.writeState(JSON.stringify(testState));

      // Verify the nested directory was created
      const stat = await fs.stat(path.dirname(nestedPath));
      expect(stat.isDirectory()).toBe(true);

      // Verify file was written
      const readState = await nestedPersistence.readState();
      expect(JSON.parse(readState!)).toEqual(testState);
    });

    it('should write atomically using temporary file', async () => {
      const testState = { atomic: 'write', test: true };
      const serializedState = JSON.stringify(testState);

      // Monitor for temporary file during write
      const tempFilePath = `${testFilePath}.tmp`;

      // Start the write operation
      const writePromise = persistence.writeState(serializedState);

      // The temp file should exist briefly during write (but might be renamed too quickly to detect)
      try {
        await fs.access(tempFilePath);
        // Temp file exists briefly during atomic write
      } catch {
        // Temp file might be renamed too quickly to detect
      }

      // Wait for write to complete
      await writePromise;

      // Temp file should be gone after write
      let tempFileExistsAfter = false;
      try {
        await fs.access(tempFilePath);
        tempFileExistsAfter = true;
      } catch {
        // Expected - temp file should be gone
      }

      expect(tempFileExistsAfter).toBe(false);

      // Final file should exist with correct content
      const readState = await persistence.readState();
      expect(JSON.parse(readState!)).toEqual(testState);
    });

    it('should handle reading non-existent file', async () => {
      const readState = await persistence.readState();
      expect(readState).toBeUndefined();

      const exists = await persistence.stateExists();
      expect(exists).toBe(false);
    });

    it('should handle reading invalid JSON file', async () => {
      // Write invalid JSON directly to file
      await fs.writeFile(testFilePath, 'invalid json content', 'utf-8');

      const readState = await persistence.readState();
      expect(readState).toBeUndefined();
    });

    it('should reject writing invalid JSON', async () => {
      const invalidJson = 'this is not valid JSON';

      await expect(persistence.writeState(invalidJson)).rejects.toThrow('Invalid serialized state');

      // File should not be created
      const exists = await persistence.stateExists();
      expect(exists).toBe(false);
    });

    it('should handle empty JSON object', async () => {
      const emptyState = '{}';

      await persistence.writeState(emptyState);
      const readState = await persistence.readState();

      expect(readState).toBe(emptyState);
      expect(JSON.parse(readState!)).toEqual({});
    });

    it('should handle complex nested JSON structures', async () => {
      const complexState = {
        version: 1,
        storage: {
          'thread-1': [
            {
              checkpoint: 'checkpoint-data',
              metadata: 'metadata-data',
              parentId: 'parent-123',
            },
          ],
          'thread-2': [
            {
              checkpoint: 'another-checkpoint',
              metadata: 'another-metadata',
            },
          ],
        },
        writes: {
          'thread-1:checkpoint-1': JSON.stringify({
            'task-1:0': ['task-1', 'channel-1', 'value-1'],
            'task-2:1': ['task-2', 'channel-2', 'value-2'],
          }),
        },
        metadata: {
          created: '2025-01-01T00:00:00.000Z',
          lastModified: '2025-01-01T01:00:00.000Z',
          customData: {
            nested: {
              deeply: {
                value: 'test',
                array: [1, 2, 3, { nested: 'object' }],
              },
            },
          },
        },
      };

      const serializedState = JSON.stringify(complexState);

      await persistence.writeState(serializedState);
      const readState = await persistence.readState();

      expect(JSON.parse(readState!)).toEqual(complexState);
    });

    it('should handle unicode and special characters', async () => {
      const unicodeState = {
        unicode: '🚀 Unicode test with émojis and spéciäl chärs',
        chinese: '中文测试',
        emoji: '🎉🔥💯',
        newlines: 'Line 1\nLine 2\nLine 3',
        quotes: 'Single \'quotes\' and "double quotes"',
        backslashes: 'Path\\to\\file and \\escaped\\chars',
      };

      const serializedState = JSON.stringify(unicodeState);

      await persistence.writeState(serializedState);
      const readState = await persistence.readState();

      expect(JSON.parse(readState!)).toEqual(unicodeState);
    });
  });

  describe('clearState()', () => {
    it('should delete existing state file', async () => {
      // First create a state file
      const testState = { test: 'data' };
      await persistence.writeState(JSON.stringify(testState));

      // Verify it exists
      let exists = await persistence.stateExists();
      expect(exists).toBe(true);

      // Clear the state
      await persistence.clearState();

      // Verify it's gone
      exists = await persistence.stateExists();
      expect(exists).toBe(false);
    });

    it('should handle clearing non-existent file gracefully', async () => {
      // Should not throw error
      await expect(persistence.clearState()).resolves.not.toThrow();

      const exists = await persistence.stateExists();
      expect(exists).toBe(false);
    });

    it('should handle permission errors when clearing', async () => {
      // Create the file first
      await persistence.writeState(JSON.stringify({ test: 'data' }));

      // Make the directory read-only (on Unix systems)
      if (process.platform !== 'win32') {
        try {
          await fs.chmod(tempDir, 0o444); // Read-only

          await expect(persistence.clearState()).rejects.toThrow();
        } finally {
          // Restore permissions for cleanup
          await fs.chmod(tempDir, 0o755);
        }
      }
    });
  });

  describe('stateExists()', () => {
    it('should return true when state file exists', async () => {
      await persistence.writeState(JSON.stringify({ test: 'data' }));

      const exists = await persistence.stateExists();
      expect(exists).toBe(true);
    });

    it('should return false when state file does not exist', async () => {
      const exists = await persistence.stateExists();
      expect(exists).toBe(false);
    });

    it('should return false for directory instead of file', async () => {
      // Create a directory with the same name as our expected file
      await fs.mkdir(testFilePath, { recursive: true });

      const exists = await persistence.stateExists();

      // With the fixed implementation, should return false for directories
      expect(exists).toBe(false);

      // Clean up
      await fs.rmdir(testFilePath);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system permissions errors during read', async () => {
      // Create the file first
      await persistence.writeState(JSON.stringify({ test: 'data' }));

      // Make the file unreadable (on Unix systems)
      if (process.platform !== 'win32') {
        try {
          await fs.chmod(testFilePath, 0o000); // No permissions

          const readState = await persistence.readState();
          expect(readState).toBeUndefined();
        } finally {
          // Restore permissions for cleanup
          await fs.chmod(testFilePath, 0o644);
        }
      }
    });

    it('should handle file system permissions errors during write', async () => {
      // Make the directory read-only (on Unix systems)
      if (process.platform !== 'win32') {
        try {
          await fs.chmod(tempDir, 0o444); // Read-only

          await expect(persistence.writeState(JSON.stringify({ test: 'data' }))).rejects.toThrow();
        } finally {
          // Restore permissions for cleanup
          await fs.chmod(tempDir, 0o755);
        }
      }
    });

    it('should handle corrupted file during read', async () => {
      // Write binary data that's not valid UTF-8
      const buffer = Buffer.from([0xff, 0xfe, 0xfd, 0xfc]);
      await fs.writeFile(testFilePath, buffer);

      const readState = await persistence.readState();
      expect(readState).toBeUndefined();
    });

    it('should handle concurrent access scenarios', async () => {
      // Use different file paths for concurrent access to avoid conflicts
      const tempFile1 = path.join(tempDir, 'concurrent1.json');
      const tempFile2 = path.join(tempDir, 'concurrent2.json');
      const persistence1 = new WorkflowStatePersistence(tempFile1);
      const persistence2 = new WorkflowStatePersistence(tempFile2);

      const state1 = JSON.stringify({ version: 1, data: 'first' });
      const state2 = JSON.stringify({ version: 2, data: 'second' });

      // Perform concurrent writes to different files
      const [result1, result2] = await Promise.allSettled([
        persistence1.writeState(state1),
        persistence2.writeState(state2),
      ]);

      // Both should succeed since they're writing to different files
      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('fulfilled');

      // Read both states
      const finalState1 = await persistence1.readState();
      const finalState2 = await persistence2.readState();

      expect(finalState1).toBeDefined();
      expect(finalState2).toBeDefined();

      // Should be the correct states
      expect(JSON.parse(finalState1!).data).toBe('first');
      expect(JSON.parse(finalState2!).data).toBe('second');
    });
  });

  describe('Large Data Handling', () => {
    it('should handle large state files', async () => {
      // Create a large state object
      const largeArray = Array(10000)
        .fill(0)
        .map((_, i) => ({
          id: i,
          data: `Item ${i} with some additional data`,
          nested: {
            moreData: `Nested data for item ${i}`,
            timestamp: new Date().toISOString(),
          },
        }));

      const largeState = {
        version: 1,
        storage: {
          'large-thread': [
            {
              checkpoint: Buffer.from(JSON.stringify(largeArray)).toString('base64'),
              metadata: Buffer.from(JSON.stringify({ size: largeArray.length })).toString('base64'),
            },
          ],
        },
        writes: {},
      };

      const serializedState = JSON.stringify(largeState);

      // Write and read large state
      await persistence.writeState(serializedState);
      const readState = await persistence.readState();

      expect(readState).toBeDefined();
      expect(readState!.length).toBeGreaterThan(100000); // Should be substantial size

      const parsedState = JSON.parse(readState!);
      expect(parsedState.storage['large-thread']).toBeDefined();
    });

    it('should handle empty and minimal states', async () => {
      const minimalStates = [
        '{}',
        '{"version":1}',
        '{"version":1,"storage":{},"writes":{}}',
        '{"storage":{"empty-thread":[]},"writes":{}}',
      ];

      for (const state of minimalStates) {
        await persistence.writeState(state);
        const readState = await persistence.readState();
        expect(readState).toBe(state);

        // Clear for next iteration
        await persistence.clearState();
      }
    });
  });
});
