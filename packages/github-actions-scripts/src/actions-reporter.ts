import * as core from '@actions/core';

type GitHubCore = typeof core;

interface PackageInfo {
  packageFullName: string;
  version: string;
  tagName: string;
}

interface ReleaseInfo {
  packageFullName: string;
  version: string;
  tagName: string;
  tarballName: string;
}

/**
 * GitHub Actions reporter utility for logging, outputs, and workflow control
 */
export class ActionsReporter {
  private core: GitHubCore;

  constructor(core: GitHubCore) {
    this.core = core;
  }

  /**
   * Log an info message
   * @param message - Message to log
   */
  info(message: string): void {
    this.core.info(message);
  }

  /**
   * Log a warning message
   * @param message - Message to log
   */
  warning(message: string): void {
    this.core.warning(message);
  }

  /**
   * Log an error message
   * @param message - Message to log
   */
  error(message: string): void {
    this.core.error(message);
  }

  /**
   * Log a step message
   * @param message - Step message
   */
  step(message: string): void {
    this.core.info(`🔄 ${message}`);
  }

  /**
   * Log a success message
   * @param message - Success message
   */
  success(message: string): void {
    this.core.info(`✅ ${message}`);
  }

  /**
   * Set a GitHub Actions output
   * @param name - Output name
   * @param value - Output value
   */
  setOutput(name: string, value: string): void {
    this.core.setOutput(name, value);
  }

  /**
   * Export a GitHub Actions variable
   * @param name - Variable name
   * @param value - Variable value
   */
  exportVariable(name: string, value: string): void {
    this.core.exportVariable(name, value);
  }

  /**
   * Set a GitHub Actions failed status
   * @param message - Failure message
   */
  setFailed(message: string): void {
    this.core.setFailed(message);
  }

  /**
   * Log package information
   * @param packageInfo - Package information
   */
  packageInfo(packageInfo: PackageInfo): void {
    this.core.info(`📦 Package: ${packageInfo.packageFullName}`);
    this.core.info(`🔢 Version: ${packageInfo.version}`);
    this.core.info(`🏷️  Tag: ${packageInfo.tagName}`);
  }

  /**
   * Log release information
   * @param releaseInfo - Release information
   */
  releaseInfo(releaseInfo: ReleaseInfo): void {
    this.core.info('');
    this.core.info('📋 Release Details:');
    this.core.info(`  Package: ${releaseInfo.packageFullName}`);
    this.core.info(`  Version: ${releaseInfo.version}`);
    this.core.info(`  Tag: ${releaseInfo.tagName}`);
    this.core.info(`  Tarball: ${releaseInfo.tarballName}`);
  }

  /**
   * Log links
   * @param links - Links object
   */
  links(links: Record<string, string>): void {
    this.core.info('');
    this.core.info('🔗 Links:');
    Object.entries(links).forEach(([label, url]) => {
      this.core.info(`  ${label}: ${url}`);
    });
  }

  /**
   * Log next steps
   * @param steps - Array of steps
   */
  nextSteps(steps: string[]): void {
    this.core.info('');
    this.core.info('📋 Next Steps:');
    steps.forEach((step, index) => {
      this.core.info(`${index + 1}. ${step}`);
    });
  }
}
