/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import fs from 'fs';
import { FileSystemOperations } from '../../src/common/fileSystem.js';

/**
 * Mock implementation of FileSystemOperations for testing
 * Provides in-memory tracking of filesystem operations without actual I/O
 */
export class MockFileSystemOperations implements FileSystemOperations {
  private existingPaths: Set<string> = new Set();
  private createdPaths: Array<{ path: string; options?: fs.MakeDirectoryOptions }> = [];

  /**
   * Configure which paths should be treated as existing
   * @param paths Paths that should return true from existsSync
   */
  setExistingPaths(paths: string[]): void {
    this.existingPaths = new Set(paths);
  }

  /**
   * Add a single path to the existing paths set
   * @param path Path to mark as existing
   */
  addExistingPath(path: string): void {
    this.existingPaths.add(path);
  }

  /**
   * Check if a path exists in the mock filesystem
   * @param path Path to check
   * @returns true if path was configured as existing, false otherwise
   */
  existsSync(path: string): boolean {
    return this.existingPaths.has(path);
  }

  /**
   * Mock directory creation - records the call without actual I/O
   * Automatically adds the path to existing paths
   *
   * @param path Path to create
   * @param options Optional mkdir options
   */
  mkdirSync(path: string, options?: fs.MakeDirectoryOptions): void {
    this.createdPaths.push({ path, options });
    this.existingPaths.add(path);
  }

  /**
   * Get the history of mkdirSync calls
   * @returns Array of mkdir calls with their parameters
   */
  getCreatedPaths(): ReadonlyArray<{ path: string; options?: fs.MakeDirectoryOptions }> {
    return [...this.createdPaths];
  }

  /**
   * Check if mkdirSync was called with a specific path
   * @param path Path to check
   * @returns true if mkdirSync was called with this path
   */
  wasPathCreated(path: string): boolean {
    return this.createdPaths.some(call => call.path === path);
  }

  /**
   * Reset all mock state
   */
  reset(): void {
    this.existingPaths.clear();
    this.createdPaths = [];
  }
}
