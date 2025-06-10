import { readFile } from 'fs/promises';
import { join } from 'path';

export interface McpToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

/**
 * Reads a type definition file from the resources directory
 * @param fileName - The name of the type definition file (e.g., 'appReviewService.d.ts')
 * @returns The contents of the type definition file
 */
export async function readTypeDefinitionFile(fileName: string): Promise<string> {
  return readFile(join(process.cwd(), 'resources', fileName), 'utf-8');
}

/**
 * Creates a service grounding context text by interpolating type definitions into a template
 * @param template - The template string containing a placeholder for type definitions
 * @param typeDefinitions - The type definitions to be interpolated into the template
 * @returns The interpolated text with type definitions
 */
export function createServiceGroundingText(template: string, typeDefinitions: string): string {
  return template.replace('${typeDefinitions}', typeDefinitions);
}
