import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getPackageInfo,
  createReleaseName,
  validatePackageVersion,
  parseReleaseTag,
} from '../src/package-utils.js';
import { generateTarballName } from '../src/npm-utils.js';

describe('package-utils', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getPackageInfo', () => {
    it('should extract package information correctly', () => {
      const packageJson = {
        name: '@salesforce/mobile-web-mcp-server',
        version: '1.2.3',
      };

      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const result = getPackageInfo(tempDir);

      expect(result).toEqual({
        packageFullName: '@salesforce/mobile-web-mcp-server',
        version: '1.2.3',
        tagName: 'mobile-web-mcp-server_v1.2.3',
        tagPrefix: 'mobile-web-mcp-server',
      });
    });

    it('should handle packages without scope', () => {
      const packageJson = {
        name: 'my-package',
        version: '0.1.0',
      };

      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const result = getPackageInfo(tempDir);

      expect(result).toEqual({
        packageFullName: 'my-package',
        version: '0.1.0',
        tagName: 'my-package_v0.1.0',
        tagPrefix: 'my-package',
      });
    });

    it('should throw error if package.json not found', () => {
      expect(() => getPackageInfo(tempDir)).toThrow('package.json not found');
    });
  });

  describe('createReleaseName', () => {
    it('should create proper release name', () => {
      const result = createReleaseName('My Package', '1.0.0');
      expect(result).toBe('My Package v1.0.0');
    });
  });

  describe('validatePackageVersion', () => {
    it('should validate matching version', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
      };

      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const result = validatePackageVersion(tempDir, '1.0.0');

      expect(result).toEqual({
        packageFullName: 'test-package',
        version: '1.0.0',
        tagName: 'test-package_v1.0.0',
        tagPrefix: 'test-package',
      });
    });

    it('should throw error for mismatched version', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
      };

      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      expect(() => validatePackageVersion(tempDir, '2.0.0')).toThrow('Version mismatch');
    });
  });

  describe('parseReleaseTag', () => {
    it('should parse valid release tag', () => {
      const result = parseReleaseTag('mobile-web_v1.2.3');
      expect(result).toEqual({
        packageIdentifier: 'mobile-web',
        packageVersion: '1.2.3',
      });
    });

    it('should handle complex package names', () => {
      const result = parseReleaseTag('mobile-web-mcp-server_v2.1.0');
      expect(result).toEqual({
        packageIdentifier: 'mobile-web-mcp-server',
        packageVersion: '2.1.0',
      });
    });

    it('should throw error for invalid tag format', () => {
      expect(() => parseReleaseTag('invalid-tag')).toThrow('Invalid release tag format');
    });
  });
});

describe('npm-utils', () => {
  describe('generateTarballName', () => {
    it('should handle scoped packages correctly', () => {
      const result = generateTarballName('@salesforce/mobile-web-mcp-server', '1.0.0');
      expect(result).toBe('salesforce-mobile-web-mcp-server-1.0.0.tgz');
    });

    it('should handle unscoped packages correctly', () => {
      const result = generateTarballName('my-package', '2.1.0');
      expect(result).toBe('my-package-2.1.0.tgz');
    });

    it('should handle complex scoped packages', () => {
      const result = generateTarballName('@my-org/sub-package/module', '0.5.2');
      expect(result).toBe('my-org-sub-package-module-0.5.2.tgz');
    });

    it('should handle packages with multiple slashes', () => {
      const result = generateTarballName('@scope/package/submodule/component', '1.2.3');
      expect(result).toBe('scope-package-submodule-component-1.2.3.tgz');
    });
  });
});
