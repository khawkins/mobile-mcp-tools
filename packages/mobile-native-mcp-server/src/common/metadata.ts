import z from 'zod';

/**
 * Base tool metadata interface - defines the general structure for tool information
 */
export interface ToolMetadata<
  TInputSchema extends z.ZodObject<z.ZodRawShape>,
  TOutputSchema extends z.ZodObject<z.ZodRawShape>,
> {
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

  /** Zod output schema for validation */
  readonly outputSchema: TOutputSchema;
}

/**
 * Workflow tool metadata interface - defines the structure for workflow tool information
 */
export interface WorkflowToolMetadata<
  TInputSchema extends z.ZodObject<z.ZodRawShape>,
  TOutputSchema extends z.ZodObject<z.ZodRawShape>,
  TResultSchema extends z.ZodObject<z.ZodRawShape>,
> extends ToolMetadata<TInputSchema, TOutputSchema> {
  /** Holds the shape of the expected result for guidance-based tools */
  readonly resultSchema: TResultSchema;
}
