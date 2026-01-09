/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import type { Command, ProgressParseResult } from '@salesforce/magen-mcp-workflow';
import {
  BuildCommandFactory,
  BuildCommandParams,
  ProgressPattern,
  PROGRESS_COMPLETE,
  PROGRESS_FAILURE,
  parseProgressWithPatterns,
} from '../types.js';

/**
 * Gradle progress patterns
 */
const ANDROID_PROGRESS_PATTERNS: ProgressPattern[] = [
  { pattern: /> Task :(\S+):(\S+)/g, weight: 1 },
  { pattern: /BUILD SUCCESSFUL/g, weight: PROGRESS_COMPLETE },
  { pattern: /BUILD FAILED/g, weight: PROGRESS_FAILURE },
];

/**
 * Android build command factory.
 * Creates Gradle build commands and parses Gradle output for progress.
 */
export class AndroidBuildCommandFactory implements BuildCommandFactory {
  create(params: BuildCommandParams): Command {
    return {
      executable: 'sh',
      args: ['-c', `cd "${params.projectPath}" && ./gradlew build`],
      env: process.env,
      cwd: params.projectPath,
    };
  }

  parseProgress(output: string, currentProgress: number): ProgressParseResult {
    return parseProgressWithPatterns(
      output,
      currentProgress,
      ANDROID_PROGRESS_PATTERNS,
      lastMatch => `Building: ${lastMatch[1]}:${lastMatch[2] || 'in progress'}`
    );
  }
}
