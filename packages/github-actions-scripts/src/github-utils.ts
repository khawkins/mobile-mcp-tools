import { Octokit } from '@octokit/rest';
import { Context } from '@actions/github/lib/context';
import { components } from '@octokit/openapi-types';

type GitHubAPI = InstanceType<typeof Octokit>;
type GitHubContext = Context;
type Release = components['schemas']['release'];
type ReleaseAsset = components['schemas']['release-asset'];

interface ReleaseData {
  tagName: string;
  name: string;
  body: string;
  prerelease?: boolean;
}

/**
 * Type guard to check if error has a status property
 */
function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).status === 'number'
  );
}

/**
 * Check if a git tag exists
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param tagName - Tag name to check
 * @returns True if tag exists
 */
export async function tagExists(
  github: GitHubAPI,
  context: GitHubContext,
  tagName: string
): Promise<boolean> {
  try {
    await github.rest.git.getRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: `tags/${tagName}`,
    });
    return true;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Create a git tag
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param tagName - Tag name
 * @param message - Tag message
 * @param sha - Commit SHA to tag
 * @returns Created tag
 */
export async function createTag(
  github: GitHubAPI,
  context: GitHubContext,
  tagName: string,
  message: string,
  sha: string
): Promise<components['schemas']['git-tag']> {
  // Create the tag using GitHub API
  const { data: tag } = await github.rest.git.createTag({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag: tagName,
    message: message,
    object: sha,
    type: 'commit',
  });

  // Create the reference to the tag
  await github.rest.git.createRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: `refs/tags/${tagName}`,
    sha: tag.sha,
  });

  return tag;
}

/**
 * Check if a release exists
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param releaseTag - Release tag
 * @returns True if release exists
 */
export async function releaseExists(
  github: GitHubAPI,
  context: GitHubContext,
  releaseTag: string
): Promise<boolean> {
  try {
    await github.rest.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: releaseTag,
    });
    return true;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get a release by tag
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param releaseTag - Release tag
 * @returns Release data
 * @throws Error with specific message if release doesn't exist
 */
export async function getRelease(
  github: GitHubAPI,
  context: GitHubContext,
  releaseTag: string
): Promise<Release> {
  try {
    const { data: release } = await github.rest.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: releaseTag,
    });
    return release;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      throw new Error(
        `Release ${releaseTag} not found. Please ensure the release exists and the tag is correct.`
      );
    }
    throw error;
  }
}

/**
 * Create a GitHub release
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param releaseData - Release configuration
 * @returns Created release
 */
export async function createRelease(
  github: GitHubAPI,
  context: GitHubContext,
  releaseData: ReleaseData
): Promise<Release> {
  const { data: release } = await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: releaseData.tagName,
    name: releaseData.name,
    body: releaseData.body,
    prerelease: releaseData.prerelease || false,
  });

  return release;
}

/**
 * Upload a release asset
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param releaseId - Release ID
 * @param assetName - Asset name
 * @param assetData - Asset data
 * @returns Uploaded asset
 * @throws Error with specific message if upload fails
 */
export async function uploadReleaseAsset(
  github: GitHubAPI,
  context: GitHubContext,
  releaseId: number,
  assetName: string,
  assetData: Buffer
): Promise<ReleaseAsset> {
  try {
    // Determine content type based on file extension
    const contentType =
      assetName.endsWith('.tgz') || assetName.endsWith('.tar.gz')
        ? 'application/gzip'
        : 'application/octet-stream';

    const { data: asset } = await github.rest.repos.uploadReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
      name: assetName,
      data: assetData as unknown as string, // Oktokit's types are off. See https://github.com/octokit/octokit.js/discussions/2087.
      headers: {
        'content-type': contentType,
        'content-length': assetData.length,
      },
    });

    return asset;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      throw new Error(`Release with ID ${releaseId} not found. Cannot upload asset ${assetName}.`);
    } else if (hasStatus(error) && error.status === 403) {
      throw new Error(
        `Access denied when uploading asset ${assetName}. Check repository permissions.`
      );
    } else if (hasStatus(error) && error.status === 422) {
      throw new Error(
        `Asset upload failed for ${assetName}. The asset may be too large or the name may be invalid.`
      );
    }
    throw error;
  }
}

/**
 * Update a release (e.g., remove prerelease flag)
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param releaseId - Release ID
 * @param updateData - Update data
 * @returns Updated release
 */
export async function updateRelease(
  github: GitHubAPI,
  context: GitHubContext,
  releaseId: number,
  updateData: { prerelease?: boolean; draft?: boolean; name?: string; body?: string }
): Promise<Release> {
  const { data: release } = await github.rest.repos.updateRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: releaseId,
    ...updateData,
  });

  return release;
}

/**
 * Download a release asset
 * @param github - GitHub API client
 * @param context - GitHub context
 * @param assetId - Asset ID
 * @returns Asset data
 * @throws Error with specific message if asset doesn't exist or can't be downloaded
 */
export async function downloadReleaseAsset(
  github: GitHubAPI,
  context: GitHubContext,
  assetId: number
): Promise<Buffer> {
  try {
    const { data: assetData } = await github.rest.repos.getReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      asset_id: assetId,
      headers: {
        Accept: 'application/octet-stream',
      },
    });

    // Handle different response types
    if (assetData instanceof ArrayBuffer) {
      return Buffer.from(assetData);
    } else if (typeof assetData === 'string') {
      return Buffer.from(assetData, 'base64');
    } else {
      // Unexpected response type - fail with diagnostic information
      const actualType = Array.isArray(assetData) ? 'array' : typeof assetData;
      const constructor = assetData?.constructor?.name || 'unknown';
      throw new Error(
        `Unexpected response type when downloading asset ${assetId}. ` +
          `Expected ArrayBuffer or string, but received ${actualType} (${constructor}). ` +
          `This may indicate a GitHub API change or network issue.`
      );
    }
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      throw new Error(
        `Release asset with ID ${assetId} not found. The asset may have been deleted or the ID is incorrect.`
      );
    } else if (hasStatus(error) && error.status === 403) {
      throw new Error(
        `Access denied when downloading asset ${assetId}. Check repository permissions.`
      );
    }
    throw error;
  }
}
