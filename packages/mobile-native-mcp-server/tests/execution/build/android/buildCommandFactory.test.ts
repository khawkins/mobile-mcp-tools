/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AndroidBuildCommandFactory } from '../../../../src/execution/build/android/buildCommandFactory.js';
import { PlatformEnum } from '../../../../src/common/schemas.js';
import { PROGRESS_COMPLETE } from '../../../../src/execution/build/types.js';

describe('AndroidBuildCommandFactory', () => {
  let factory: AndroidBuildCommandFactory;

  beforeEach(() => {
    factory = new AndroidBuildCommandFactory();
  });

  describe('create', () => {
    it('should create command with correct executable', () => {
      const params = {
        platform: 'Android' as PlatformEnum,
        projectPath: '/path/to/project',
        projectName: 'TestApp',
        buildOutputDir: '/output',
      };

      const command = factory.create(params);

      expect(command.executable).toBe('sh');
      expect(command.args).toContain('-c');
    });

    it('should include project path in command', () => {
      const params = {
        platform: 'Android' as PlatformEnum,
        projectPath: '/custom/path',
        projectName: 'TestApp',
        buildOutputDir: '/output',
      };

      const command = factory.create(params);

      expect(command.args[1]).toContain('/custom/path');
    });

    it('should include gradlew build command', () => {
      const params = {
        platform: 'Android' as PlatformEnum,
        projectPath: '/path/to/project',
        projectName: 'TestApp',
        buildOutputDir: '/output',
      };

      const command = factory.create(params);

      expect(command.args[1]).toContain('./gradlew build');
    });

    it('should set cwd to project path', () => {
      const params = {
        platform: 'Android' as PlatformEnum,
        projectPath: '/path/to/project',
        projectName: 'TestApp',
        buildOutputDir: '/output',
      };

      const command = factory.create(params);

      expect(command.cwd).toBe('/path/to/project');
    });

    it('should use process.env for environment', () => {
      const params = {
        platform: 'Android' as PlatformEnum,
        projectPath: '/path/to/project',
        projectName: 'TestApp',
        buildOutputDir: '/output',
      };

      const command = factory.create(params);

      expect(command.env).toBe(process.env);
    });
  });

  describe('parseProgress', () => {
    it('should increment progress on task matches', () => {
      const output = '> Task :app:compileDebugJavaWithJavac';
      const result = factory.parseProgress(output, 0);

      expect(result.progress).toBeGreaterThan(0);
      expect(result.message).toBeDefined();
    });

    it('should extract task information from match', () => {
      const output = '> Task :app:compileDebugJavaWithJavac';
      const result = factory.parseProgress(output, 0);

      expect(result.message).toContain('app');
      expect(result.message).toContain('compileDebugJavaWithJavac');
    });

    it('should set progress to complete on BUILD SUCCESSFUL', () => {
      const output = 'BUILD SUCCESSFUL in 10s';
      const result = factory.parseProgress(output, 50);

      expect(result.progress).toBe(PROGRESS_COMPLETE);
      expect(result.message).toBe('Build completed successfully');
    });

    it('should not update progress on BUILD FAILED', () => {
      const output = 'BUILD FAILED';
      const currentProgress = 50;
      const result = factory.parseProgress(output, currentProgress);

      expect(result.progress).toBe(currentProgress);
      expect(result.message).toBe('Build failed');
    });

    it('should handle multiple task matches', () => {
      const output = `> Task :app:compileDebugJavaWithJavac
> Task :app:processDebugResources
> Task :app:packageDebug`;
      const result = factory.parseProgress(output, 0);

      expect(result.progress).toBeGreaterThan(0);
    });

    it('should use last match for message', () => {
      const output = `> Task :app:compileDebugJavaWithJavac
> Task :app:packageDebug`;
      const result = factory.parseProgress(output, 0);

      expect(result.message).toContain('packageDebug');
    });

    it('should never decrease progress', () => {
      const output = 'Some output without matches';
      const currentProgress = 50;
      const result = factory.parseProgress(output, currentProgress);

      expect(result.progress).toBeGreaterThanOrEqual(currentProgress);
    });

    it('should handle empty output', () => {
      const result = factory.parseProgress('', 10);

      expect(result.progress).toBe(10);
    });

    it('should handle partial task output', () => {
      const output = '> Task :app:';
      const result = factory.parseProgress(output, 0);

      expect(result.progress).toBeGreaterThanOrEqual(0);
    });
  });
});
