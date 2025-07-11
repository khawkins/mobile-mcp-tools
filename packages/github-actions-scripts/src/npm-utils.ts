import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TarballInfo {
  tarballName: string;
  tarballPath: string;
}

/**
 * Essential package.json structure for verification
 */
interface PackageJsonInfo {
  name: string;
  version: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown; // Allow additional properties
}

interface VerificationResult {
  verified: boolean;
  files?: string[];
  extractedVersion?: string;
  packageJson?: PackageJsonInfo;
  error?: string;
}

/**
 * Generate expected NPM tarball name from package info
 * NPM follows predictable naming: @scope/package-name becomes scope-package-name-version.tgz
 * @param packageName - Full package name (e.g., @salesforce/mobile-web-mcp-server)
 * @param version - Package version (e.g., 1.0.0)
 * @returns Expected tarball filename
 */
export function generateTarballName(packageName: string, version: string): string {
  // Remove @scope/ prefix and replace slashes/@ with dashes, following npm pack naming
  const sanitizedName = packageName
    .replace(/^@/, '') // Remove leading @
    .replace(/\//g, '-'); // Replace / with -

  return `${sanitizedName}-${version}.tgz`;
}

/**
 * Safely extract error message from unknown error object
 * @param error - Error object of unknown type
 * @returns Safe error message string
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Create NPM package tarball
 * @param packagePath - Path to package directory
 * @returns Tarball information
 */
export function createTarball(packagePath: string): TarballInfo {
  const originalCwd = process.cwd();

  try {
    process.chdir(packagePath);

    // Get tarball filename without creating it
    const dryRunOutput = execSync('npm pack --dry-run --json', { encoding: 'utf8' });
    const packInfo = JSON.parse(dryRunOutput);
    const tarballName = packInfo[0].filename;

    // Create the actual tarball
    execSync('npm pack', { stdio: 'inherit' });

    // Verify tarball was created
    if (!fs.existsSync(tarballName)) {
      throw new Error(`Tarball not created: ${tarballName}`);
    }

    const tarballPath = path.join(packagePath, tarballName);

    return {
      tarballName,
      tarballPath,
    };
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Check if a package version is already published to NPM
 * @param packageName - Full package name
 * @param version - Package version
 * @returns True if already published
 */
export function isVersionPublished(packageName: string, version: string): boolean {
  try {
    // Check if this version is already published
    execSync(`npm view "${packageName}@${version}" version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Publish package to NPM
 * @param tarballPath - Path to tarball
 * @param npmTag - NPM tag (e.g., 'latest', 'beta')
 * @param dryRun - Whether to perform a dry run
 * @returns True if successful
 * @throws Error with descriptive message if publish fails
 */
export function publishToNpm(tarballPath: string, npmTag = 'latest', dryRun = false): boolean {
  const dryRunFlag = dryRun ? '--dry-run' : '';

  try {
    execSync(`npm publish "${tarballPath}" --tag "${npmTag}" ${dryRunFlag}`.trim(), {
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    throw new Error(
      `Failed to ${dryRun ? 'validate' : 'publish'} package: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Verify tarball contents
 * @param tarballPath - Path to tarball
 * @param expectedVersion - Expected version in package.json
 * @param tempDir - Temporary directory for extraction
 * @returns Verification results
 */
export function verifyTarball(
  tarballPath: string,
  expectedVersion: string,
  tempDir = './temp-verify'
): VerificationResult {
  try {
    // Show tarball contents (first 20 files)
    const contents = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf8' });
    const files = contents
      .split('\n')
      .slice(0, 20)
      .filter(file => file);

    // Extract to temporary directory for verification
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    execSync(`tar -xzf "${tarballPath}" -C "${tempDir}"`);

    // Verify package.json exists and version matches
    const extractedPackageJsonPath = path.join(tempDir, 'package', 'package.json');
    if (!fs.existsSync(extractedPackageJsonPath)) {
      throw new Error('package.json not found in extracted tarball');
    }

    const extractedPackageJson = JSON.parse(
      fs.readFileSync(extractedPackageJsonPath, 'utf8')
    ) as PackageJsonInfo;
    const extractedVersion = extractedPackageJson.version;

    if (extractedVersion !== expectedVersion) {
      throw new Error(
        `Version mismatch in tarball:\n  Expected: ${expectedVersion}\n  Found: ${extractedVersion}`
      );
    }

    return {
      verified: true,
      files,
      extractedVersion,
      packageJson: extractedPackageJson,
    };
  } catch (error) {
    return {
      verified: false,
      error: getErrorMessage(error),
    };
  }
}

export interface CleanupResult {
  directory: string;
  success: boolean;
  existed: boolean;
  error?: string;
}

/**
 * Clean up temporary directories
 * @param directories - Directories to clean up
 * @returns Array of cleanup results
 */
export function cleanup(directories: string[]): CleanupResult[] {
  return directories.map(dir => {
    const existed = fs.existsSync(dir);

    try {
      if (existed) {
        fs.rmSync(dir, { recursive: true, force: true });
      }

      return {
        directory: dir,
        success: true,
        existed,
      };
    } catch (error) {
      return {
        directory: dir,
        success: false,
        existed,
        error: getErrorMessage(error),
      };
    }
  });
}
