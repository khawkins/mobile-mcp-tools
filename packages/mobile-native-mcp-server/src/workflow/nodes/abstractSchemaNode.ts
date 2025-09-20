import z from 'zod';
import { BaseNode } from './abstractBaseNode.js';
import {
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  WorkflowToolMetadata,
} from '../../common/metadata.js';

export abstract class AbstractSchemaNode<
  TInputSchema extends typeof WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  TResultSchema extends z.ZodObject<z.ZodRawShape>,
  TOutputSchema extends
    typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA = typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
> extends BaseNode {
  protected abstract readonly workflowToolMetadata: WorkflowToolMetadata<
    TInputSchema,
    TResultSchema,
    TOutputSchema
  >;

  constructor(name: string) {
    super(name);
  }
}
