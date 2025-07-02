import { ZodObject } from 'zod';

export interface Tool {
  name: string;
  inputSchema: ZodObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
