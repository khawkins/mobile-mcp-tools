/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import z from 'zod';
import { Logger, createComponentLogger } from '../../logging/logger.js';
import { ToolMetadata } from '../../common/metadata.js';

/**
 * Abstract base class for ALL MCP tools in the workflow engine
 *
 * Provides comprehensive functionality including:
 * - Server instance management
 * - Logging with component identification
 * - Standardized registration pattern
 * - Workflow state round-tripping support
 * - Post-invocation instruction patterns
 * - Shared utility methods
 *
 * @template TMetadata - Tool metadata type extending ToolMetadata
 */
export abstract class AbstractTool<
  TMetadata extends ToolMetadata<z.ZodObject<z.ZodRawShape>, z.ZodObject<z.ZodRawShape>>,
> {
  protected readonly logger: Logger;

  constructor(
    protected readonly server: McpServer,
    public readonly toolMetadata: TMetadata,
    loggerComponentName?: string,
    logger?: Logger
  ) {
    this.logger = logger || createComponentLogger(loggerComponentName || this.constructor.name);
  }

  /**
   * Register the tool with the MCP server
   * @param annotations Tool annotations for MCP client hints
   */
  public register(annotations: ToolAnnotations): void {
    this.logRegistration(annotations);

    const enhancedAnnotations = {
      ...annotations,
      title: this.toolMetadata.title,
    };

    this.server.registerTool(
      this.toolMetadata.toolId,
      {
        description: this.toolMetadata.description,
        inputSchema: this.toolMetadata.inputSchema.shape,
        outputSchema: this.toolMetadata.outputSchema.shape,
        ...enhancedAnnotations,
      },
      this.handleRequest
    );
  }

  /**
   * Abstract method that implementing tools must provide for handling requests
   *
   * Uses the same typing pattern as registerTool() ToolCallback<InputArgs>.
   * @param input The input to the callback
   * @returns The return result of the tool
   */
  public abstract handleRequest: ToolCallback<TMetadata['inputSchema']['shape']>;

  /**
   * Logs tool registration information
   * @param annotations The tool annotations
   */
  protected logRegistration(annotations: ToolAnnotations): void {
    this.logger.info(`Registering MCP tool: ${this.toolMetadata.toolId}`, { annotations });
  }

  /**
   * Logs an error that occurred during tool execution
   * @param message A descriptive error message
   * @param error The error object
   * @param data Additional context data
   */
  protected logError(message: string, error: Error, data?: unknown): void {
    this.logger.error(message, error);
    if (data) {
      this.logger.debug('Error context data', data);
    }
  }

  /**
   * Creates a child logger for a specific operation within the tool
   * @param operationName The name of the operation
   * @returns A child logger instance
   */
  protected createOperationLogger(operationName: string): Logger {
    return this.logger.child({ operation: operationName });
  }

  /**
   * Logs workflow-specific events with enhanced context
   * @param event The workflow event description
   * @param data Additional workflow context data
   */
  protected logWorkflowEvent(event: string, data?: Record<string, unknown>): void {
    this.logger.info(event, {
      ...(data || {}),
      workflowTool: true,
      toolId: this.toolMetadata.toolId,
    });
  }
}
