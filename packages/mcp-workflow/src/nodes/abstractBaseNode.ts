/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { StateType, StateDefinition } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import type { ProgressReporter } from '../execution/progressReporter.js';

/**
 * Extended RunnableConfig with workflow-specific configurable properties.
 * Nodes can access runtime dependencies via config.configurable.
 */
export interface WorkflowRunnableConfig extends RunnableConfig {
  configurable?: RunnableConfig['configurable'] & {
    /** Thread ID for checkpointing */
    thread_id?: string;
    /** Progress reporter for long-running operations */
    progressReporter?: ProgressReporter;
  };
}

/**
 * Base class for all workflow nodes
 *
 * LangGraph supports both sync and async node functions. This base class
 * supports both patterns - nodes can return Partial<TState> synchronously
 * or Promise<Partial<TState>> asynchronously.
 *
 * Nodes receive an optional second parameter `config` (RunnableConfig) that
 * contains runtime context like progress reporters, thread IDs, etc. This
 * is the proper way to access runtime dependencies without polluting state.
 *
 * @template TState - The state type for the workflow (defaults to StateType&lt;StateDefinition&gt;)
 *
 * Example (sync):
 * ```
 * const MyWorkflowState = Annotation.Root({ count: Annotation<number> });
 * type State = typeof MyWorkflowState.State;
 *
 * class IncrementNode extends BaseNode<State> {
 *   constructor() {
 *     super('increment');
 *   }
 *
 *   execute = (state: State) => {
 *     return { count: state.count + 1 };
 *   };
 * }
 * ```
 *
 * Example (async with config):
 * ```
 * class AsyncNode extends BaseNode<State> {
 *   constructor() {
 *     super('asyncNode');
 *   }
 *
 *   execute = async (state: State, config?: WorkflowRunnableConfig) => {
 *     const progressReporter = config?.configurable?.progressReporter;
 *     progressReporter?.report(50, 100, 'Processing...');
 *     const result = await someAsyncOperation();
 *     return { data: result };
 *   };
 * }
 * ```
 */
export abstract class BaseNode<TState extends StateType<StateDefinition>> {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract execute: (
    state: TState,
    config?: WorkflowRunnableConfig
  ) => Partial<TState> | Promise<Partial<TState>>;
}
