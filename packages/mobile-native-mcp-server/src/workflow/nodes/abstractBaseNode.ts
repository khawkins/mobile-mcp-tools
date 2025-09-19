import { State } from '../metadata.js';

export abstract class BaseNode {
  abstract readonly name: string;
  abstract execute(state: State): Partial<State>;
}
