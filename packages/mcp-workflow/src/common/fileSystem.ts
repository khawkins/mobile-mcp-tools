/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Filesystem Operations Abstraction
 *
 * Provides a dependency injection interface for filesystem operations,
 * enabling testability and flexibility across the workflow engine.
 */

import fs from 'fs';

/**
 * Interface for filesystem operations - enables dependency injection for testing
 * and alternative filesystem implementations
 */
export interface FileSystemOperations {
  /**
   * Check if a path exists in the filesystem
   * @param path Path to check
   * @returns true if the path exists, false otherwise
   */
  existsSync(path: string): boolean;

  /**
   * Create a directory (and any necessary parent directories)
   * @param path Directory path to create
   * @param options Options for directory creation (e.g., recursive, mode)
   */
  mkdirSync(path: string, options?: fs.MakeDirectoryOptions): void;
}

/**
 * Production implementation of FileSystemOperations using Node.js fs module
 */
/* c8 ignore start */
export class NodeFileSystemOperations implements FileSystemOperations {
  existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  mkdirSync(path: string, options?: fs.MakeDirectoryOptions): void {
    fs.mkdirSync(path, options);
  }
}
/* c8 ignore stop */
