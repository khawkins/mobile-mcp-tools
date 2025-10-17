/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { FileSystemProvider } from '../../src/utils/FileSystemProvider.js';

/**
 * Mock implementation of FileSystemProvider for testing
 * Allows tests to control directory paths without creating real directories
 * Tracks calls for verification
 */
export class MockFileSystemProvider implements FileSystemProvider {
  private mockTempDir: string;
  private tempDirCounter = 0;
  public rmSyncCalls: Array<{ path: string; options?: { recursive?: boolean; force?: boolean } }> =
    [];

  constructor(mockTempDir = '/mock/temp/dir') {
    this.mockTempDir = mockTempDir;
  }

  existsSync(_filePath: string): boolean {
    // For testing, always return true to avoid filesystem checks
    return true;
  }

  mkdtempSync(prefix: string): string {
    // Return a predictable mock path without creating real directories
    this.tempDirCounter++;
    return `${prefix}${this.tempDirCounter}`;
  }

  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void {
    // Track the call for verification in tests
    this.rmSyncCalls.push({ path, options });
  }

  tmpdir(): string {
    return this.mockTempDir;
  }

  /**
   * Reset the counter and call tracking for predictable test behavior
   */
  reset(): void {
    this.tempDirCounter = 0;
    this.rmSyncCalls = [];
  }
}
