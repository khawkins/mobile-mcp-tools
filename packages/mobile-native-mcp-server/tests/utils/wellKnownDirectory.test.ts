/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import os from 'os';
import {
  WELL_KNOWN_DIR_NAME,
  WELL_KNOWN_FILES,
  getWellKnownDirectoryPath,
  ensureWellKnownDirectory,
  getWellKnownFilePath,
  getWorkflowStateStorePath,
  getWorkflowLogsPath,
  wellKnownDirectoryExists,
  getWellKnownDirectoryInfo,
} from '../../src/utils/wellKnownDirectory.js';

// Mock fs module
vi.mock('fs', () => {
  return {
    default: {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

// Import fs after mocking
import fs from 'fs';

describe('Well-Known Directory Utils', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
    // Reset fs mocks
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.mkdirSync).mockReset();
  });

  afterEach(() => {
    // Restore environment variables
    process.env = { ...originalEnv };
  });

  describe('getWellKnownDirectoryPath', () => {
    it('should use home directory by default', () => {
      const homeDir = os.homedir();
      const expected = path.join(homeDir, WELL_KNOWN_DIR_NAME);

      const result = getWellKnownDirectoryPath();

      expect(result).toBe(expected);
    });

    it('should use PROJECT_PATH environment variable when set', () => {
      // Use a path that works on all platforms
      const testPath = path.resolve('/test/project/path');
      process.env.PROJECT_PATH = testPath;
      const expected = path.join(testPath, WELL_KNOWN_DIR_NAME);

      const result = getWellKnownDirectoryPath();

      expect(result).toBe(expected);
    });
  });

  describe('ensureWellKnownDirectory', () => {
    it('should create directory if it does not exist', () => {
      const homeDir = os.homedir();
      const expectedPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);

      // Mock directory does not exist
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = ensureWellKnownDirectory();

      expect(result).toBe(expectedPath);
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      const homeDir = os.homedir();
      const expectedPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);

      // Mock directory already exists
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = ensureWellKnownDirectory();

      expect(result).toBe(expectedPath);
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getWellKnownFilePath', () => {
    it('should return path to file in well-known directory', () => {
      const homeDir = os.homedir();
      const dirPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);
      const fileName = 'test-file.json';
      const expectedPath = path.join(dirPath, fileName);

      // Mock directory exists to avoid creating it
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = getWellKnownFilePath(fileName);

      expect(result).toBe(expectedPath);
      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
    });
  });

  describe('Convenience file path functions', () => {
    it('should return workflow state store path', () => {
      const homeDir = os.homedir();
      const dirPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);
      const expectedPath = path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME);

      // Mock directory exists to avoid creating it
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = getWorkflowStateStorePath();

      expect(result).toBe(expectedPath);
    });

    it('should return workflow logs path', () => {
      const homeDir = os.homedir();
      const dirPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);
      const expectedPath = path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS);

      // Mock directory exists to avoid creating it
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = getWorkflowLogsPath();

      expect(result).toBe(expectedPath);
    });
  });

  describe('wellKnownDirectoryExists', () => {
    it('should return true if directory exists', () => {
      // Mock directory exists
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = wellKnownDirectoryExists();

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(getWellKnownDirectoryPath());
    });

    it('should return false if directory does not exist', () => {
      // Mock directory does not exist
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = wellKnownDirectoryExists();

      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(getWellKnownDirectoryPath());
    });
  });

  describe('getWellKnownDirectoryInfo', () => {
    it('should return directory info when directory exists', () => {
      const homeDir = os.homedir();
      const dirPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);

      // Mock directory and files exist
      vi.mocked(fs.existsSync).mockImplementation(() => true);

      const result = getWellKnownDirectoryInfo();

      expect(result).toEqual({
        exists: true,
        path: dirPath,
        files: [
          {
            name: WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME,
            exists: true,
            path: path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
          },
          {
            name: WELL_KNOWN_FILES.WORKFLOW_LOGS,
            exists: true,
            path: path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
          },
        ],
      });
    });

    it('should return directory info when directory does not exist', () => {
      const homeDir = os.homedir();
      const dirPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);

      // Mock directory does not exist
      vi.mocked(fs.existsSync).mockImplementation(p => {
        // Return false for the directory check, which is the first call
        if (p === dirPath) {
          return false;
        }
        // For any other path (file checks), also return false
        return false;
      });

      const result = getWellKnownDirectoryInfo();

      expect(result).toEqual({
        exists: false,
        path: dirPath,
        files: [
          {
            name: WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME,
            exists: false,
            path: path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
          },
          {
            name: WELL_KNOWN_FILES.WORKFLOW_LOGS,
            exists: false,
            path: path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
          },
        ],
      });
    });

    it('should return correct file existence status', () => {
      const homeDir = os.homedir();
      const dirPath = path.join(homeDir, WELL_KNOWN_DIR_NAME);

      // Mock directory exists but only one file exists
      vi.mocked(fs.existsSync).mockImplementation(p => {
        if (p === dirPath) {
          return true; // Directory exists
        }
        // Only workflow state file exists
        return p === path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME);
      });

      const result = getWellKnownDirectoryInfo();

      expect(result).toEqual({
        exists: true,
        path: dirPath,
        files: [
          {
            name: WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME,
            exists: true,
            path: path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME),
          },
          {
            name: WELL_KNOWN_FILES.WORKFLOW_LOGS,
            exists: false,
            path: path.join(dirPath, WELL_KNOWN_FILES.WORKFLOW_LOGS),
          },
        ],
      });
    });
  });
});
