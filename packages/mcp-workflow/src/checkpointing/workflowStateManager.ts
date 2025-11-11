/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as path from 'path';
import { BaseCheckpointSaver, MemorySaver } from '@langchain/langgraph';
import { createComponentLogger, Logger } from '../logging/logger.js';
import { JsonCheckpointSaver } from './jsonCheckpointer.js';
import { WellKnownDirectoryManager, WELL_KNOWN_FILES } from '../storage/wellKnownDirectory.js';
import { FileSystemOperations, NodeFileSystemOperations } from '../common/fileSystem.js';

/**
 * Workflow execution environment
 */
export type WorkflowEnvironment = 'production' | 'test';

/**
 * Configuration for WorkflowStateManager
 */
export interface WorkflowStateManagerConfig {
  /**
   * Execution environment - determines checkpointing strategy
   * - 'production': Uses JsonCheckpointSaver with .magen/ directory persistence
   * - 'test': Uses MemorySaver for isolated, in-memory state (no file I/O)
   * Default: 'production'
   */
  environment?: WorkflowEnvironment;

  /**
   * Optional project path for well-known directory (.magen/)
   * Used to customize the location of workflow state files
   * Defaults to os.homedir() if not specified
   */
  projectPath?: string;

  /**
   * Optional filesystem operations implementation for dependency injection
   * Defaults to NodeFileSystemOperations for production use
   */
  fileSystemOperations?: FileSystemOperations;

  /**
   * Optional logger for state management operations
   */
  logger?: Logger;
}

/**
 * Manages workflow state persistence and checkpointer lifecycle
 *
 * This service encapsulates all workflow state management responsibilities:
 * - Creating and configuring checkpointers (MemorySaver vs JsonCheckpointSaver)
 * - Loading existing state from disk
 * - Saving state to disk
 * - Managing well-known directory paths
 *
 * This separation allows the orchestrator to focus on workflow execution logic
 * while delegating all state management concerns to this service.
 */
export class WorkflowStateManager {
  private readonly logger: Logger;
  private readonly environment: WorkflowEnvironment;
  private readonly wellKnownDirectoryManager: WellKnownDirectoryManager;
  private readonly fileSystemOperations: FileSystemOperations;

  constructor(config: WorkflowStateManagerConfig = {}) {
    this.logger = config.logger || createComponentLogger('WorkflowStateManager');
    this.environment = config.environment || 'production';
    this.fileSystemOperations = config.fileSystemOperations ?? new NodeFileSystemOperations();
    this.wellKnownDirectoryManager = new WellKnownDirectoryManager({
      projectPath: config.projectPath,
      fileSystemOperations: this.fileSystemOperations,
    });
  }

  /**
   * Creates a checkpointer configured for the current environment
   *
   * For 'test' environment:
   * - Returns MemorySaver (in-memory, no file I/O)
   *
   * For 'production' environment:
   * - Returns JsonCheckpointSaver
   * - Automatically loads existing state from disk if available
   * - Creates fresh checkpointer if no state exists
   *
   * @returns A configured checkpointer ready for use
   */
  async createCheckpointer(): Promise<BaseCheckpointSaver> {
    if (this.environment === 'test') {
      this.logger.debug('Creating MemorySaver for test environment');
      return new MemorySaver();
    }

    // Production environment: Use JsonCheckpointSaver with state persistence
    this.logger.debug('Creating JsonCheckpointSaver for production environment');
    const checkpointer = new JsonCheckpointSaver();

    // Load existing state if available
    const serializedState = await this.readState();
    if (serializedState) {
      this.logger.info('Importing existing checkpointer state from disk');
      await checkpointer.importState(serializedState);
    } else {
      this.logger.info('No existing state found, starting with fresh checkpointer');
    }

    return checkpointer;
  }

  /**
   * Saves checkpointer state to disk (production mode only)
   *
   * Only applies to JsonCheckpointSaver. MemorySaver (used in test mode)
   * intentionally does not persist state.
   *
   * @param checkpointer - The checkpointer to save
   * @throws Error if test environment unexpectedly has JsonCheckpointSaver
   */
  async saveCheckpointerState(checkpointer: BaseCheckpointSaver): Promise<void> {
    // Skip persistence for test environment (uses MemorySaver)
    if (this.environment === 'test') {
      // Sanity check: test environment should never have JsonCheckpointSaver
      if (checkpointer instanceof JsonCheckpointSaver) {
        throw new Error(
          'Invalid state: test environment should use MemorySaver, not JsonCheckpointSaver'
        );
      }
      this.logger.debug('Skipping state persistence in test environment');
      return;
    }

    // Production environment: persist JsonCheckpointSaver state
    if (!(checkpointer instanceof JsonCheckpointSaver)) {
      this.logger.warn(
        'Checkpointer is not JsonCheckpointSaver in production environment, skipping persistence'
      );
      return;
    }

    const exportedState = await checkpointer.exportState();
    await this.writeState(exportedState);
    this.logger.info('Checkpointer state successfully persisted to disk');
  }

  /**
   * Reads the serialized state from disk if it exists
   * @returns The serialized state string, or undefined if the file doesn't exist or is invalid
   */
  private async readState(): Promise<string | undefined> {
    const storePath = this.getStatePath();

    try {
      // Check if the file exists
      await this.fileSystemOperations.access(storePath);

      this.logger.info(`Reading checkpointer state from: ${storePath}`);

      // Read the file content
      const content = await this.fileSystemOperations.readFile(storePath, 'utf-8');

      // Validate that it's valid JSON
      JSON.parse(content);

      this.logger.debug('Successfully read and validated checkpointer state', {
        stateSize: content.length,
        path: storePath,
      });

      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.info(
          `Checkpointer state file not found: ${storePath}. Starting with fresh state.`
        );
        return undefined;
      } else if (error instanceof SyntaxError) {
        this.logger.warn(
          `Invalid JSON in state file: ${storePath}. Starting with fresh state.`,
          error
        );
        return undefined;
      } else {
        this.logger.error(`Failed to read checkpointer state from: ${storePath}`, error as Error);
        return undefined;
      }
    }
  }

  /**
   * Writes the serialized state to disk
   * @param serializedState The state to persist
   */
  private async writeState(serializedState: string): Promise<void> {
    const storePath = this.getStatePath();

    try {
      // Ensure the directory exists
      const storeDir = path.dirname(storePath);
      await this.fileSystemOperations.mkdir(storeDir, { recursive: true });

      // Validate that the state is valid JSON before writing
      JSON.parse(serializedState);

      this.logger.info(`Saving checkpointer state to: ${storePath}`);

      // Write the state to a temporary file first, then rename for atomicity
      const tempPath = `${storePath}.tmp`;
      await this.fileSystemOperations.writeFile(tempPath, serializedState, 'utf-8');
      await this.fileSystemOperations.rename(tempPath, storePath);

      this.logger.debug('Successfully saved checkpointer state', {
        stateSize: serializedState.length,
        path: storePath,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.error(
          `Invalid JSON state provided for persistence. State not saved.`,
          error as Error
        );
        throw new Error(`Invalid serialized state: ${error.message}`);
      } else {
        this.logger.error(`Failed to save checkpointer state to: ${storePath}`, error as Error);
        throw error;
      }
    }
  }

  /**
   * Deletes the persisted state file
   */
  async clearState(): Promise<void> {
    const storePath = this.getStatePath();

    try {
      await this.fileSystemOperations.unlink(storePath);
      this.logger.info(`Cleared checkpointer state file: ${storePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.debug(`State file already doesn't exist: ${storePath}`);
      } else {
        this.logger.error(`Failed to clear state file: ${storePath}`, error as Error);
        throw error;
      }
    }
  }

  /**
   * Checks if a persisted state file exists
   */
  async stateExists(): Promise<boolean> {
    const storePath = this.getStatePath();

    try {
      const stat = await this.fileSystemOperations.stat(storePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Gets the file path for workflow state storage
   */
  private getStatePath(): string {
    return this.wellKnownDirectoryManager.getWellKnownFilePath(
      WELL_KNOWN_FILES.WORKFLOW_STATE_STORE_FILENAME
    );
  }
}
