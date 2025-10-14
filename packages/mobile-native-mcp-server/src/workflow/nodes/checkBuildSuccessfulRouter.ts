/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { State } from '../metadata.js';

/**
 * Router node that determines the next step based on build success status.
 *
 * Routes to:
 * - deploymentNodeName: if build was successful
 * - buildRecoveryNodeName: if build failed and we have retries remaining AND we haven't just attempted recovery
 * - failureNodeName: if build failed and either max retries reached OR recovery couldn't help
 */
export class CheckBuildSuccessfulRouter {
  private readonly deploymentNodeName: string;
  private readonly buildRecoveryNodeName: string;
  private readonly failureNodeName: string;

  constructor(deploymentNodeName: string, buildRecoveryNodeName: string, failureNodeName: string) {
    this.deploymentNodeName = deploymentNodeName;
    this.buildRecoveryNodeName = buildRecoveryNodeName;
    this.failureNodeName = failureNodeName;
  }

  execute = (state: State): string => {
    // If build was successful, proceed to deployment
    if (state.buildSuccessful) {
      return this.deploymentNodeName;
    }

    // Build failed - check if we should attempt recovery
    const attemptCount = state.buildAttemptCount ?? 0;
    const maxRetries = state.maxBuildRetries ?? 3;

    // If we've reached max retries, go to failure
    if (attemptCount >= maxRetries) {
      return this.failureNodeName;
    }

    // If we just came from recovery and it said it's not ready to retry, go to failure
    if (state.recoveryReadyForRetry === false) {
      return this.failureNodeName;
    }

    // Otherwise, attempt recovery
    return this.buildRecoveryNodeName;
  };
}
