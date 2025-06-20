import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'fs/promises';
import {
  readTypeDefinitionFile,
  readBaseCapability,
  readMobileCapabilities,
} from '../../src/utils/util';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('Utility Functions', () => {
  describe('readTypeDefinitionFile', () => {
    it('should read type definition file from resources directory', async () => {
      const mockContent = 'mock type definitions';
      const fileName = 'testService.d.ts';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const result = await readTypeDefinitionFile(fileName);

      expect(result).toBe(mockContent);
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining(`resources/${fileName}`),
        'utf-8'
      );
    });

    it('should throw error when file read fails', async () => {
      const fileName = 'nonexistent.d.ts';
      const error = new Error('File not found');
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(readTypeDefinitionFile(fileName)).rejects.toThrow('File not found');
    });
  });

  describe('readBaseCapability', () => {
    it('should read BaseCapability type definition file from resources directory', async () => {
      const mockContent = 'interface BaseCapability { /* mock content */ }';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const result = await readBaseCapability();

      expect(result).toBe(mockContent);
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('resources/BaseCapability.d.ts'),
        'utf-8'
      );
    });

    it('should throw error when BaseCapability file read fails', async () => {
      const error = new Error('File not found');
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(readBaseCapability()).rejects.toThrow('File not found');
    });
  });

  describe('readMobileCapabilities', () => {
    it('should read mobileCapabilities type definition file from resources directory', async () => {
      const mockContent = 'interface MobileCapabilities { /* mock content */ }';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const result = await readMobileCapabilities();

      expect(result).toBe(mockContent);
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('resources/mobileCapabilities.d.ts'),
        'utf-8'
      );
    });

    it('should throw error when mobileCapabilities file read fails', async () => {
      const error = new Error('File not found');
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(readMobileCapabilities()).rejects.toThrow('File not found');
    });
  });
});
