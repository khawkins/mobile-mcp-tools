import fs from 'fs';
import path from 'path';

interface PackageInfo {
  packageFullName: string;
  version: string;
  tagName: string;
  tagPrefix: string;
}

interface ParsedReleaseTag {
  packageIdentifier: string;
  packageVersion: string;
}

/**
 * Get package information from package.json
 * @param packagePath - Path to package directory
 * @returns Package information
 */
export function getPackageInfo(packagePath: string): PackageInfo {
  const packageJsonPath = path.join(packagePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageFullName = packageJson.name;
  const version = packageJson.version;

  // Create standardized names
  // Remove @scope/ prefix and replace slashes with dashes for tag
  const tagPrefix = packageFullName.replace(/^@[^/]+\//, '').replace(/\//g, '-');
  const tagName = `${tagPrefix}_v${version}`;

  return {
    packageFullName,
    version,
    tagName,
    tagPrefix,
  };
}

/**
 * Create release name from display name and version
 * @param displayName - Package display name
 * @param version - Package version
 * @returns Release name
 */
export function createReleaseName(displayName: string, version: string): string {
  return `${displayName} v${version}`;
}

/**
 * Validate package version matches expected version
 * @param packagePath - Path to package directory
 * @param expectedVersion - Expected version
 * @returns Package information if valid
 */
export function validatePackageVersion(packagePath: string, expectedVersion: string): PackageInfo {
  const packageInfo = getPackageInfo(packagePath);

  if (packageInfo.version !== expectedVersion) {
    throw new Error(
      `Version mismatch:\n  Expected: ${expectedVersion}\n  Found: ${packageInfo.version}`
    );
  }

  return packageInfo;
}

/**
 * Parse release tag to extract package identifier and version
 * @param releaseTag - Release tag (format: package-name_vX.X.X)
 * @returns Parsed tag information
 */
export function parseReleaseTag(releaseTag: string): ParsedReleaseTag {
  const tagMatch = releaseTag.match(/^(.+)_v(.+)$/);
  if (!tagMatch) {
    throw new Error(
      `Invalid release tag format: ${releaseTag}. Expected format: <package-name>_v<version>`
    );
  }

  const packageIdentifier = tagMatch[1];
  const packageVersion = tagMatch[2];

  return {
    packageIdentifier,
    packageVersion,
  };
}
