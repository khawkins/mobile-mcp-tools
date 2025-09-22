/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { FileSystemProvider } from '../../../../src/utils/FileSystemProvider.js';

/**
 * Mock file system provider for testing
 */
export class MockFileSystemProvider implements FileSystemProvider {
  private existingFiles = new Set<string>();

  /**
   * Set which files should be considered as existing
   */
  setExistingFiles(filePaths: string[]): void {
    this.existingFiles.clear();
    filePaths.forEach(path => this.existingFiles.add(path));
  }

  /**
   * Add a file to the existing files set
   */
  addExistingFile(filePath: string): void {
    this.existingFiles.add(filePath);
  }

  /**
   * Clear all existing files
   */
  clearExistingFiles(): void {
    this.existingFiles.clear();
  }

  existsSync(filePath: string): boolean {
    return this.existingFiles.has(filePath);
  }
}
