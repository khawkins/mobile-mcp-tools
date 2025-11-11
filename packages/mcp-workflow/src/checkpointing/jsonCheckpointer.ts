/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
} from '@langchain/langgraph';
import {
  CheckpointListOptions,
  CheckpointPendingWrite,
  PendingWrite,
  WRITES_IDX_MAP,
} from '@langchain/langgraph-checkpoint';

interface SerializedState {
  version: 1;
  storage: Record<string, { checkpoint: string; metadata: string; parentId?: string }[]>;
  writes: Record<string, string>;
}

function createCheckpointKey(config: RunnableConfig): string {
  const threadId = config.configurable?.thread_id;
  const checkpointId = config.configurable?.checkpoint_id;
  if (!threadId || !checkpointId) {
    throw new Error(
      `Invalid config, missing thread_id or checkpoint_id: ${JSON.stringify(config.configurable)}`
    );
  }
  return `${threadId}:${checkpointId}`;
}

export class JsonCheckpointSaver extends BaseCheckpointSaver {
  private state: SerializedState = { version: 1, storage: {}, writes: {} };

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      throw new Error('thread_id not found in config');
    }

    const checkpoints = this.state.storage[threadId];
    if (!checkpoints || checkpoints.length === 0) {
      return undefined;
    }

    // This logic correctly gets the latest checkpoint.
    // In this implementation, the latest is always at index 0.
    const latest = checkpoints[0];

    const checkpointPromise = this.serde.loadsTyped(
      'json',
      Buffer.from(latest.checkpoint, 'base64')
    );
    const metadataPromise = this.serde.loadsTyped('json', Buffer.from(latest.metadata, 'base64'));
    const [checkpoint, metadata] = await Promise.all([checkpointPromise, metadataPromise]);

    // Rehydrate pending writes associated with this checkpoint
    const pendingWrites: CheckpointPendingWrite[] = [];
    const checkpointKey = createCheckpointKey({
      configurable: { thread_id: threadId, checkpoint_id: checkpoint.id },
    });
    const savedWrites = this.state.writes[checkpointKey];
    if (savedWrites) {
      const parsedWrites: Record<string, [string, string, string]> = JSON.parse(savedWrites);
      for (const [taskId, channel, valueBase64] of Object.values(parsedWrites)) {
        pendingWrites.push([
          taskId,
          channel,
          await this.serde.loadsTyped('json', Buffer.from(valueBase64, 'base64')),
        ]);
      }
    }

    const checkpointTuple: CheckpointTuple = {
      config,
      checkpoint,
      metadata,
      pendingWrites,
    };

    if (latest.parentId) {
      checkpointTuple.parentConfig = {
        configurable: { thread_id: threadId, checkpoint_id: latest.parentId },
      };
    }

    return checkpointTuple;
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      throw new Error('thread_id not found in config');
    }
    if (!this.state.storage[threadId]) {
      this.state.storage[threadId] = [];
    }

    const checkpointPromise = this.serde.dumpsTyped(checkpoint);
    const metadataPromise = this.serde.dumpsTyped(metadata);
    const [[, checkpointBytes], [, metadataBytes]] = await Promise.all([
      checkpointPromise,
      metadataPromise,
    ]);

    const parentId = config.configurable?.checkpoint_id;

    // unshift() adds to the beginning, ensuring the latest is always at index 0.
    this.state.storage[threadId].unshift({
      checkpoint: Buffer.from(checkpointBytes).toString('base64'),
      metadata: Buffer.from(metadataBytes).toString('base64'),
      parentId: parentId,
    });

    return {
      configurable: { thread_id: threadId, checkpoint_id: checkpoint.id },
    };
  }

  async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void> {
    const key = createCheckpointKey(config);

    const existingWritesString = this.state.writes[key];
    const existingWrites: Record<string, [string, string, string]> = existingWritesString
      ? JSON.parse(existingWritesString)
      : {};

    for (const [index, [channel, value]] of writes.entries()) {
      const [, serializedValue] = await this.serde.dumpsTyped(value);
      const valueBase64 = Buffer.from(serializedValue).toString('base64');
      const innerKey = `${taskId}:${WRITES_IDX_MAP[channel] ?? index}`;
      existingWrites[innerKey] = [taskId, channel, valueBase64];
    }

    this.state.writes[key] = JSON.stringify(existingWrites);
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      return;
    }
    const checkpoints = this.state.storage[threadId] ?? [];
    let count = 0;

    for (const saved of checkpoints) {
      const metadataPromise = this.serde.loadsTyped('json', Buffer.from(saved.metadata, 'base64'));
      const metadata = (await metadataPromise) as CheckpointMetadata;

      // Apply filter if provided
      if (
        options?.filter &&
        !Object.entries(options.filter).every(
          ([key, value]) => (metadata as unknown as Record<string, unknown>)[key] === value
        )
      ) {
        continue;
      }

      // Apply limit if provided
      if (options?.limit && count >= options.limit) {
        return;
      }
      count++;

      const checkpoint = (await this.serde.loadsTyped(
        'json',
        Buffer.from(saved.checkpoint, 'base64')
      )) as Checkpoint;

      const tuple: CheckpointTuple = {
        config: {
          configurable: { thread_id: threadId, checkpoint_id: checkpoint.id },
        },
        checkpoint,
        metadata,
      };

      if (saved.parentId) {
        tuple.parentConfig = {
          configurable: { thread_id: threadId, checkpoint_id: saved.parentId },
        };
      }
      yield tuple;
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    delete this.state.storage[threadId];
    for (const key of Object.keys(this.state.writes)) {
      if (key.startsWith(`${threadId}:`)) {
        delete this.state.writes[key];
      }
    }
  }

  /**
   * Exports the entire state of the checkpointer as a single JSON string.
   */
  async exportState(): Promise<string> {
    return JSON.stringify(this.state);
  }

  /**
   * Imports and overwrites the entire state of the checkpointer.
   */
  async importState(jsonState: string) {
    const parsedState = JSON.parse(jsonState);
    // Basic check for future migration logic
    if (!parsedState.version) {
      parsedState.version = 1;
    }
    this.state = parsedState;
  }
}
