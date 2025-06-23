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
