/**
 * Interface for file system operations
 */
export interface FileSystemServiceProvider {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  readFileSync(path: string, encoding?: BufferEncoding): string;
  writeFileSync(path: string, data: string | Buffer, encoding?: BufferEncoding): void;
  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
}
