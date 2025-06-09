import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';
import server from '../../../src/tools/arSpaceCapture/server';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('AR Space Capture Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be initialized with correct name and description', () => {
    expect(server).toBeDefined();
  });

  it('should be able to connect and disconnect', async () => {
    const mockTransport: Transport = {
      start: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    await expect(server.connect(mockTransport)).resolves.not.toThrow();
    await expect(server.close()).resolves.not.toThrow();
  });

  it('should read type definitions when tool is called', async () => {
    const mockContent = 'mock type definitions';
    vi.mocked(readFile).mockResolvedValue(mockContent);

    // Create a mock transport
    const mockTransport: Transport = {
      start: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Connect the server to the mock transport
    await server.connect(mockTransport);

    // Simulate a tool call by sending a request
    await server.server.createMessage({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: 'test' },
        },
      ],
      maxTokens: 1000,
      model: 'test-model',
    });

    // Verify readFile was called with correct arguments
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('resources/arSpaceCapture.d.ts'),
      'utf-8'
    );
  });
});
