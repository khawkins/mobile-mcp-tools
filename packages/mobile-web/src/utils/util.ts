import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Reads a type definition file from the resources directory
 * @param fileName - The name of the type definition file (e.g., 'appReviewService.d.ts')
 * @returns The contents of the type definition file
 */
export async function readTypeDefinitionFile(fileName: string): Promise<string> {
  return readFile(
    join(process.cwd(), 'packages', 'mobile-web', 'dist', 'resources', fileName),
    'utf-8'
  );
}

/**
 * Reads the BaseCapability type definition file from the resources directory
 * @returns The contents of the BaseCapability type definition file
 */
export async function readBaseCapability(): Promise<string> {
  return readFile(
    join(process.cwd(), 'packages', 'mobile-web', 'dist', 'resources', 'BaseCapability.d.ts'),
    'utf-8'
  );
}

/**
 * Reads the mobileCapabilities type definition file from the resources directory
 * @returns The contents of the mobileCapabilities type definition file
 */
export async function readMobileCapabilities(): Promise<string> {
  return readFile(
    join(process.cwd(), 'packages', 'mobile-web', 'dist', 'resources', 'mobileCapabilities.d.ts'),
    'utf-8'
  );
}

/**
 * Creates a service grounding context text by interpolating type definitions and capability definitions into a template
 * @param template - The template string containing placeholders for type and capability definitions
 * @param typeDefinitions - The service type definitions to be interpolated
 * @param baseCapability - The base capability interface definition to be interpolated
 * @param mobileCapabilities - The mobile capabilities module definition to be interpolated
 * @returns The interpolated text with all definitions
 */
export function createServiceGroundingText(
  template: string,
  typeDefinitions: string,
  baseCapability: string,
  mobileCapabilities: string
): string {
  return template
    .replace('${typeDefinitions}', typeDefinitions)
    .replace('${baseCapability}', baseCapability)
    .replace('${mobileCapabilities}', mobileCapabilities);
}
