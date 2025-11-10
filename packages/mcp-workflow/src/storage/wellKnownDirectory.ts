/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Well-Known Directory Management
 *
 * Centralized management of the .magen well-known directory structure for the
 * Mobile Native MCP Server. This directory contains persistent project artifacts
 * including workflow state, logging, and other cross-session data.
 *
 * Directory structure:
 * .magen/
 * ├── workflow-state.db    # SQLite database for LangGraph workflow persistence
 * ├── workflow_logs.json   # Structured JSON logs for workflow operations
 * └── [future artifacts]   # Additional project artifacts as needed
 */

import path from 'path';
import os from 'os';
import { FileSystemOperations, NodeFileSystemOperations } from '../common/fileSystem.js';

/**
 * Well-known directory name - hidden directory at project root
 */
export const WELL_KNOWN_DIR_NAME = '.magen';

/**
 * Well-known file names within the .magen directory
 */
export const WELL_KNOWN_FILES = {
  WORKFLOW_STATE_STORE_FILENAME: 'workflow-state.json',
  WORKFLOW_LOGS: 'workflow_logs.json',
} as const;

/**
 * Configuration for WellKnownDirectoryManager
 */
export interface WellKnownDirectoryConfig {
  /** Optional project path override (defaults to PROJECT_PATH env var or home directory) */
  projectPath?: string;
  /** Optional filesystem operations implementation (defaults to NodeFileSystemOperations) */
  fileSystemOperations?: FileSystemOperations;
}

/**
 * Class-based well-known directory manager with dependency injection support
 */
export class WellKnownDirectoryManager {
  private readonly fileSystemOperations: FileSystemOperations;
  private readonly baseDirPath: string;

  constructor(config: WellKnownDirectoryConfig = {}) {
    this.fileSystemOperations = config.fileSystemOperations ?? new NodeFileSystemOperations();

    const baseDir = config.projectPath
      ? path.resolve(config.projectPath)
      : process.env.PROJECT_PATH
        ? path.resolve(process.env.PROJECT_PATH)
        : os.homedir();

    this.baseDirPath = path.join(baseDir, WELL_KNOWN_DIR_NAME);
  }

  /**
   * Get the absolute path to the .magen directory
   * @returns Absolute path to .magen directory
   */
  getWellKnownDirectoryPath(): string {
    return this.baseDirPath;
  }

  /**
   * Ensure the .magen directory exists, creating it if necessary
   * Safe to call multiple times - idempotent operation
   *
   * @returns Absolute path to the .magen directory
   */
  ensureWellKnownDirectory(): string {
    if (!this.fileSystemOperations.existsSync(this.baseDirPath)) {
      this.fileSystemOperations.mkdirSync(this.baseDirPath, { recursive: true });
    }
    return this.baseDirPath;
  }

  /**
   * Get the absolute path to a specific file within the .magen directory
   * Ensures the directory exists before returning the path
   *
   * @param fileName - Name of the file within .magen directory
   * @returns Absolute path to the specified file
   */
  getWellKnownFilePath(fileName: string): string {
    const wellKnownDir = this.ensureWellKnownDirectory();
    return path.join(wellKnownDir, fileName);
  }

  /**
   * Get the path to the workflow state database
   * @returns Absolute path to workflow-state.json
   */
  getWorkflowStateStorePath(): string {
    return this.getWellKnownFilePath(WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME);
  }

  /**
   * Get the path to the workflow logs file
   * @returns Absolute path to workflow_logs.json
   */
  getWorkflowLogsPath(): string {
    return this.getWellKnownFilePath(WELL_KNOWN_FILES.WORKFLOW_LOGS);
  }

  /**
   * Check if the .magen directory exists
   * @returns true if directory exists, false otherwise
   */
  wellKnownDirectoryExists(): boolean {
    return this.fileSystemOperations.existsSync(this.baseDirPath);
  }

  /**
   * Get information about the .magen directory and its contents
   * Useful for debugging and status reporting
   *
   * @returns Object with directory status and file information
   */
  getWellKnownDirectoryInfo(): {
    exists: boolean;
    path: string;
    files: Array<{ name: string; exists: boolean; path: string }>;
  } {
    const dirPath = this.getWellKnownDirectoryPath();
    const exists = this.wellKnownDirectoryExists();

    const files = Object.values(WELL_KNOWN_FILES).map(fileName => ({
      name: fileName,
      exists: exists && this.fileSystemOperations.existsSync(path.join(dirPath, fileName)),
      path: path.join(dirPath, fileName),
    }));

    return {
      exists,
      path: dirPath,
      files,
    };
  }
}
