/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as fs from 'fs';
import * as os from 'os';

/**
 * Interface for file system operations
 */
export interface FileSystemProvider {
  /**
   * Check if a file or directory exists
   */
  existsSync(filePath: string): boolean;

  /**
   * Create a temporary directory with a given prefix
   * @param prefix - Prefix for the temp directory name
   * @returns Full path to the created directory
   */
  mkdtempSync(prefix: string): string;

  /**
   * Remove a file or directory
   * @param path - Path to remove
   * @param options - Options for removal (recursive, force, etc.)
   */
  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;

  /**
   * Get the OS temp directory path
   * @returns Path to the OS temp directory
   */
  tmpdir(): string;
}

/**
 * Production implementation using Node.js fs and os modules
 */
export class NodeFileSystemProvider implements FileSystemProvider {
  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  mkdtempSync(prefix: string): string {
    return fs.mkdtempSync(prefix);
  }

  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void {
    fs.rmSync(path, options);
  }

  tmpdir(): string {
    return os.tmpdir();
  }
}

/**
 * Default file system provider instance
 */
export const defaultFileSystemProvider = new NodeFileSystemProvider();
