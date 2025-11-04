/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import {
  WELL_KNOWN_DIR_NAME,
  WELL_KNOWN_FILES,
  WellKnownDirectoryManager,
} from '../../src/storage/wellKnownDirectory.js';
import { MockFileSystemOperations } from '../utils/MockFileSystemOperations.js';

describe('Well-Known Directory Utils', () => {
  let mockFs: MockFileSystemOperations;
  let manager: WellKnownDirectoryManager;
  const testHomeDir = '/test/home';

  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockFs = new MockFileSystemOperations();
    // Reset environment variables
    process.env = { ...originalEnv };
    // Create manager with mock filesystem and test path
    manager = new WellKnownDirectoryManager({
      projectPath: testHomeDir,
      fileSystemOperations: mockFs,
    });
  });

  afterEach(() => {
    // Restore environment variables
    process.env = { ...originalEnv };
  });

  describe('WellKnownDirectoryManager - Class-based API', () => {
    describe('getWellKnownDirectoryPath', () => {
      it('should return path based on provided projectPath', () => {
        const expected = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);
        const result = manager.getWellKnownDirectoryPath();
        expect(result).toBe(expected);
      });

      it('should respect PROJECT_PATH environment variable when no projectPath provided', () => {
        const envPath = '/env/project/path';
        process.env.PROJECT_PATH = envPath;

        const managerWithEnv = new WellKnownDirectoryManager({
          fileSystemOperations: mockFs,
        });

        const expected = path.resolve(envPath, WELL_KNOWN_DIR_NAME);
        expect(managerWithEnv.getWellKnownDirectoryPath()).toBe(expected);
      });

      it('should use home directory when no projectPath or PROJECT_PATH provided', () => {
        delete process.env.PROJECT_PATH;

        const managerWithDefaults = new WellKnownDirectoryManager({
          fileSystemOperations: mockFs,
        });

        const homeDir = os.homedir();
        const expected = path.join(homeDir, WELL_KNOWN_DIR_NAME);
        expect(managerWithDefaults.getWellKnownDirectoryPath()).toBe(expected);
      });
    });

    describe('ensureWellKnownDirectory', () => {
      it('should create directory if it does not exist', () => {
        const expectedPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);

        // Directory doesn't exist initially
        expect(mockFs.existsSync(expectedPath)).toBe(false);

        const result = manager.ensureWellKnownDirectory();

        expect(result).toBe(expectedPath);
        expect(mockFs.wasPathCreated(expectedPath)).toBe(true);
        const createdPaths = mockFs.getCreatedPaths();
        expect(createdPaths[0].options).toEqual({ recursive: true });
      });

      it('should not create directory if it already exists', () => {
        const expectedPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);

        // Mark directory as existing
        mockFs.addExistingPath(expectedPath);

        const result = manager.ensureWellKnownDirectory();

        expect(result).toBe(expectedPath);
        expect(mockFs.getCreatedPaths()).toHaveLength(0);
      });
    });

    describe('getWellKnownFilePath', () => {
      it('should return path to file in well-known directory', () => {
        const dirPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);
        const fileName = 'test-file.json';
        const expectedPath = path.resolve(dirPath, fileName);

        // Mark directory as existing to avoid creating it
        mockFs.addExistingPath(dirPath);

        const result = manager.getWellKnownFilePath(fileName);

        expect(result).toBe(expectedPath);
      });

      it('should ensure directory exists before returning file path', () => {
        const dirPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);
        const fileName = 'test-file.json';

        // Directory doesn't exist initially
        const result = manager.getWellKnownFilePath(fileName);

        // Should have created the directory
        expect(mockFs.wasPathCreated(dirPath)).toBe(true);
        expect(result).toBe(path.resolve(dirPath, fileName));
      });
    });

    describe('Convenience file path methods', () => {
      beforeEach(() => {
        // Mark directory as existing for these tests
        mockFs.addExistingPath(path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME));
      });

      it('should return workflow state store path', () => {
        const expectedPath = path.resolve(
          testHomeDir,
          WELL_KNOWN_DIR_NAME,
          WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME
        );

        const result = manager.getWorkflowStateStorePath();

        expect(result).toBe(expectedPath);
      });

      it('should return workflow logs path', () => {
        const expectedPath = path.resolve(
          testHomeDir,
          WELL_KNOWN_DIR_NAME,
          WELL_KNOWN_FILES.WORKFLOW_LOGS
        );

        const result = manager.getWorkflowLogsPath();

        expect(result).toBe(expectedPath);
      });
    });

    describe('wellKnownDirectoryExists', () => {
      it('should return true if directory exists', () => {
        const dirPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);
        mockFs.addExistingPath(dirPath);

        const result = manager.wellKnownDirectoryExists();

        expect(result).toBe(true);
      });

      it('should return false if directory does not exist', () => {
        const result = manager.wellKnownDirectoryExists();

        expect(result).toBe(false);
      });
    });

    describe('getWellKnownDirectoryInfo', () => {
      it('should return directory info when directory exists', () => {
        const dirPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);

        // Mark directory and files as existing
        mockFs.setExistingPaths([
          dirPath,
          path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
          path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
        ]);

        const result = manager.getWellKnownDirectoryInfo();

        expect(result).toEqual({
          exists: true,
          path: dirPath,
          files: [
            {
              name: WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME,
              exists: true,
              path: path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
            },
            {
              name: WELL_KNOWN_FILES.WORKFLOW_LOGS,
              exists: true,
              path: path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
            },
          ],
        });
      });

      it('should return directory info when directory does not exist', () => {
        const dirPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);

        const result = manager.getWellKnownDirectoryInfo();

        expect(result).toEqual({
          exists: false,
          path: dirPath,
          files: [
            {
              name: WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME,
              exists: false,
              path: path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
            },
            {
              name: WELL_KNOWN_FILES.WORKFLOW_LOGS,
              exists: false,
              path: path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
            },
          ],
        });
      });

      it('should return correct file existence status', () => {
        const dirPath = path.resolve(testHomeDir, WELL_KNOWN_DIR_NAME);

        // Directory exists but only one file exists
        mockFs.setExistingPaths([
          dirPath,
          path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
        ]);

        const result = manager.getWellKnownDirectoryInfo();

        expect(result).toEqual({
          exists: true,
          path: dirPath,
          files: [
            {
              name: WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME,
              exists: true,
              path: path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
            },
            {
              name: WELL_KNOWN_FILES.WORKFLOW_LOGS,
              exists: false,
              path: path.resolve(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
            },
          ],
        });
      });
    });
  });
});
