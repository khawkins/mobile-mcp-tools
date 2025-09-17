import z from 'zod';

/**
 * Tool metadata interface - defines the structure for tool information
 */
export interface ToolMetadata<TInputSchema extends z.ZodObject<z.ZodRawShape>> {
  /** Unique tool identifier used for MCP registration and workflow orchestration */
  readonly toolId: string;

  /** Human-readable tool name for display */
  readonly name: string;

  /** Extended tool title for detailed display */
  readonly title: string;

  /** Tool description for documentation and LLM context */
  readonly description: string;

  /** Zod input schema for validation */
  readonly inputSchema: TInputSchema;
}

/**
 * Utility type to extract the input type from a ToolMetadata
 * Usage: ToolInputType<typeof DEPLOYMENT_TOOL>
 */
export type ToolInputType<T extends ToolMetadata<z.ZodObject<z.ZodRawShape>>> = z.infer<
  T['inputSchema']
>;

/**
 * Utility type to extract the input schema shape from a ToolMetadata
 * Usage: ToolInputShape<typeof DEPLOYMENT_TOOL>
 */
export type ToolInputShape<T extends ToolMetadata<z.ZodObject<z.ZodRawShape>>> =
  T['inputSchema']['shape'];
