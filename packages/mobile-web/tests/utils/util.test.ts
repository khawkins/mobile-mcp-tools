import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'fs/promises';
import { readTypeDefinitionFile, createServiceGroundingText } from '../../src/utils/util';

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

  describe('createServiceGroundingText', () => {
    it('should interpolate type definitions into template', () => {
      const template = `# Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
      const typeDefinitions = 'interface Test { value: string; }';

      const result = createServiceGroundingText(template, typeDefinitions);

      expect(result).toBe(`# Service API
\`\`\`typescript
interface Test { value: string; }
\`\`\``);
    });

    it('should handle empty type definitions', () => {
      const template = `# Service API
\`\`\`typescript
\${typeDefinitions}
\`\`\``;
      const typeDefinitions = '';

      const result = createServiceGroundingText(template, typeDefinitions);

      expect(result).toBe(`# Service API
\`\`\`typescript

\`\`\``);
    });

    it('should handle template without placeholder', () => {
      const template = '# Service API';
      const typeDefinitions = 'interface Test { value: string; }';

      const result = createServiceGroundingText(template, typeDefinitions);

      expect(result).toBe('# Service API');
    });
  });
});
