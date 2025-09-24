/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createComponentLogger, Logger } from '../logging/logger.js';

/**
 * Utility class for persisting and recalling LangGraph checkpointer state
 */
export class WorkflowStatePersistence {
  private readonly logger: Logger;
  constructor(private readonly storePath: string) {
    this.logger = createComponentLogger('WorkflowStatePersistence');
  }

  /**
   * Reads the serialized state from disk if it exists
   * @returns The serialized state string, or undefined if the file doesn't exist or is invalid
   */
  async readState(): Promise<string | undefined> {
    try {
      // Check if the file exists
      await fs.access(this.storePath);

      this.logger.info(`Reading checkpointer state from: ${this.storePath}`);

      // Read the file content
      const content = await fs.readFile(this.storePath, 'utf-8');

      // Validate that it's valid JSON
      JSON.parse(content);

      this.logger.debug('Successfully read and validated checkpointer state', {
        stateSize: content.length,
        path: this.storePath,
      });

      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.info(
          `Checkpointer state file not found: ${this.storePath}. Starting with fresh state.`
        );
        return undefined;
      } else if (error instanceof SyntaxError) {
        this.logger.warn(
          `Invalid JSON in state file: ${this.storePath}. Starting with fresh state.`,
          error
        );
        return undefined;
      } else {
        this.logger.error(
          `Failed to read checkpointer state from: ${this.storePath}`,
          error as Error
        );
        return undefined;
      }
    }
  }

  /**
   * Writes the serialized state to disk
   * @param serializedState The state to persist
   */
  async writeState(serializedState: string): Promise<void> {
    try {
      // Ensure the directory exists
      const storeDir = path.dirname(this.storePath);
      await fs.mkdir(storeDir, { recursive: true });

      // Validate that the state is valid JSON before writing
      JSON.parse(serializedState);

      this.logger.info(`Saving checkpointer state to: ${this.storePath}`);

      // Write the state to a temporary file first, then rename for atomicity
      const tempPath = `${this.storePath}.tmp`;
      await fs.writeFile(tempPath, serializedState, 'utf-8');
      await fs.rename(tempPath, this.storePath);

      this.logger.debug('Successfully saved checkpointer state', {
        stateSize: serializedState.length,
        path: this.storePath,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.error(
          `Invalid JSON state provided for persistence. State not saved.`,
          error as Error
        );
        throw new Error(`Invalid serialized state: ${error.message}`);
      } else {
        this.logger.error(
          `Failed to save checkpointer state to: ${this.storePath}`,
          error as Error
        );
        throw error;
      }
    }
  }

  /**
   * Deletes the persisted state file
   */
  async clearState(): Promise<void> {
    try {
      await fs.unlink(this.storePath);
      this.logger.info(`Cleared checkpointer state file: ${this.storePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.debug(`State file already doesn't exist: ${this.storePath}`);
      } else {
        this.logger.error(`Failed to clear state file: ${this.storePath}`, error as Error);
        throw error;
      }
    }
  }

  /**
   * Checks if a persisted state file exists
   */
  async stateExists(): Promise<boolean> {
    try {
      await fs.access(this.storePath);
      return true;
    } catch {
      return false;
    }
  }
}
