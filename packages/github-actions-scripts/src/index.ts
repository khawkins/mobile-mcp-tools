// Main entry point for GitHub Actions scripts
export {
  getPackageInfo,
  createReleaseName,
  parseReleaseTag,
  validatePackageVersion,
} from './package-utils.js';
export {
  tagExists,
  createTag,
  createRelease,
  uploadReleaseAsset,
  updateRelease,
  getRelease,
  downloadReleaseAsset,
} from './github-utils.js';
export {
  createTarball,
  isVersionPublished,
  publishToNpm,
  verifyTarball,
  cleanup,
  getErrorMessage,
  generateTarballName,
} from './npm-utils.js';
export { ActionsReporter } from './actions-reporter.js';
export { ReleaseOrchestrator } from './release-orchestrator.js';

// Re-export useful types from the official packages
export type { Octokit } from '@octokit/rest';
export type { Context } from '@actions/github/lib/context';
export type { components } from '@octokit/openapi-types';
export * as core from '@actions/core';
