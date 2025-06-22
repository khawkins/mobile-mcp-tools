import { ZodObject } from 'zod';

export interface Tool {
  name: string;
  inputSchema: ZodObject<any>;
}
