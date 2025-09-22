/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as fs from 'fs';

/**
 * Interface for file system operations used by the Xcode add files tool
 */
export interface FileSystemProvider {
  /**
   * Check if a file or directory exists
   */
  existsSync(filePath: string): boolean;
}

/**
 * Production implementation using Node.js fs module
 */
export class NodeFileSystemProvider implements FileSystemProvider {
  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}

/**
 * Default file system provider instance
 */
export const defaultFileSystemProvider = new NodeFileSystemProvider();
