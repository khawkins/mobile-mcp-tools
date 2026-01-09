/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Simple interface for reporting progress of long-running operations.
 * Used to send periodic notifications to keep tasks alive during execution.
 */
export interface ProgressReporter {
  /**
   * Reports progress of a long-running operation.
   *
   * @param progress - Current progress value (0-100)
   * @param total - Optional total value for calculating percentage
   * @param message - Optional message describing current progress
   */
  report(progress: number, total?: number, message?: string): void;
}

/**
 * No-op progress reporter for when progress reporting is not needed.
 */
export class NoOpProgressReporter implements ProgressReporter {
  report(_progress: number, _total?: number, _message?: string): void {
    // No-op implementation
  }
}

/**
 * MCP progress reporter that sends notifications via MCP protocol.
 * Uses fire-and-forget pattern to avoid blocking execution.
 */
export class MCPProgressReporter implements ProgressReporter {
  private static readonly PROGRESS_TOTAL = 100;

  constructor(
    private readonly sendNotification: (notification: {
      method: string;
      params?: unknown;
    }) => Promise<void>,
    private readonly progressToken: string
  ) {
    if (!progressToken) {
      throw new Error('Progress token is required for MCPProgressReporter');
    }
  }

  report(
    progress: number,
    total: number = MCPProgressReporter.PROGRESS_TOTAL,
    message?: string
  ): void {
    const percentage =
      total > 0 ? Math.round((progress / total) * MCPProgressReporter.PROGRESS_TOTAL) : 0;

    // Fire-and-forget notification pattern
    // Use MCP notification format: notifications/progress with progressToken, message, progress, total
    try {
      const notification = {
        method: 'notifications/progress',
        params: {
          progressToken: this.progressToken,
          message: message || `Progress: ${percentage}%`,
          progress: percentage,
          total: MCPProgressReporter.PROGRESS_TOTAL,
        },
      };

      // Send message notification for clients that don't support progress notifications
      this.sendNotification({
        method: 'notifications/message',
        params: {
          message: message ? `Progress: ${percentage}%: ${message}` : `Progress: ${percentage}%`,
        },
      });
      this.sendNotification(notification).catch(() => {
        // Silently ignore notification errors to avoid blocking execution
      });
    } catch (_error) {
      // Silently ignore notification errors to avoid blocking execution
    }
  }
}

/**
 * Creates an MCP progress reporter from sendNotification function and progress token.
 *
 * @param sendNotification - Function to send MCP notifications
 * @param progressToken - Progress token from MCP request context
 * @returns MCPProgressReporter instance, or NoOpProgressReporter if token is missing
 */
export function createMCPProgressReporter(
  sendNotification:
    | ((notification: { method: string; params?: unknown }) => Promise<void>)
    | undefined,
  progressToken: string | undefined
): ProgressReporter {
  // Always create MCPProgressReporter if we have both parameters
  // This ensures progress notifications are sent, even if they might fail
  if (sendNotification && progressToken) {
    return new MCPProgressReporter(sendNotification, progressToken);
  }

  // Only use NoOpProgressReporter if we truly don't have the required parameters
  // This should not happen in production - it's a fallback for testing
  return new NoOpProgressReporter();
}
