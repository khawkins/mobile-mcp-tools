import { vi } from 'vitest';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { readFile } from 'fs/promises';

export const createMockTransport = (): Transport => ({
  start: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
});

export const mockReadFile = (content: string) => {
  vi.mocked(readFile).mockResolvedValue(content);
};
